from flask import Flask, render_template, request, redirect, url_for, flash, session
import mysql.connector
from werkzeug.security import check_password_hash
from datetime import datetime
from decimal import Decimal
import requests
import json
from flask import jsonify
import os
from dotenv import load_dotenv
from flask import send_from_directory

# Initialize Flask app ONCE - remove the duplicate
load_dotenv()
app = Flask(__name__, static_folder='static', static_url_path='/static')
app.secret_key = os.getenv('APP_SECRET_KEY', 'dev-secret-change')

# Add CORS headers for API calls
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Add error handlers for debugging
@app.errorhandler(404)
def not_found_error(error):
    print(f"404 Error: {error}")
    return "Page not found", 404

@app.errorhandler(500)
def internal_error(error):
    print(f"500 Error: {error}")
    return "Internal server error", 500

# Database connection configuration (ONLY ONCE)
DB_HOST = os.getenv('DB_HOST', '127.0.0.1')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASS = os.getenv('DB_PASS', 'secret')
DB_NAME = os.getenv('DB_NAME', 'clubinho')

def get_db_connection():
    conn = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME
    )
    # Relax strict date checks so legacy '0000-00-00' rows don't error
    try:
        cur = conn.cursor()
        cur.execute("SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'NO_ZERO_DATE',''))")
        cur.execute("SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'NO_ZERO_IN_DATE',''))")
    finally:
        cur.close()
    return conn

# Utility function to safely convert Decimal to float (ONLY ONCE)
def safe_decimal_to_float(value):
    """Safely convert Decimal to float, handling None values"""
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    try:
        return float(value)
    except (ValueError, TypeError):
        return 0.0

def safe_convert_row(row):
    """Convert a database row, handling Decimal values"""
    return tuple(
        safe_decimal_to_float(item) if isinstance(item, Decimal) else item
        for item in row
    )

# Exchange rate function (ONLY ONCE)
def get_exchange_rate():
    """
    Get current BRL to JPY exchange rate from external API
    Returns tuple (rate, source)
    """
    try:
        # Try ExchangeRate-API (free tier available)
        response = requests.get(
            'https://api.exchangerate-api.com/v4/latest/BRL',
            timeout=5
        )

        if response.status_code == 200:
            data = response.json()
            if 'rates' in data and 'JPY' in data['rates']:
                rate = data['rates']['JPY']
                return round(rate, 4), 'ExchangeRate-API'

    except Exception as e:
        print(f"Error fetching from ExchangeRate-API: {e}")

    # Fallback to a reasonable default rate if API fails
    # You should update this periodically with a reasonable BRL to JPY rate
    return 30.0, 'Fallback (Update manually)'

# Route 1: Root - Redirect to login
@app.route('/')
def index():
    """Root route - redirects to admin login"""
    return redirect(url_for('admin_login'))

# Route 2: Admin Login
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    """Admin login page - handles authentication"""
    if request.method == 'POST':
        login = request.form['login']
        password = request.form['password']
        conn = None

        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            # Query admin table
            cursor.execute("SELECT id, login, password FROM login WHERE login = %s", (login,))
            admin = cursor.fetchone()

            if admin:
                stored_password = admin[2]  # password field

                # Check if password is hashed or plain text
                if stored_password.startswith('pbkdf2:'):
                    # Hashed password
                    password_valid = check_password_hash(stored_password, password)
                else:
                    # Plain text password
                    password_valid = (stored_password == password)

                if password_valid:
                    # Set admin session
                    session['admin_id'] = admin[0]
                    session['admin_login'] = admin[1]
                    session['is_admin'] = True
                    flash('Login successful!')
                    return redirect(url_for('dashboard'))

            flash('Invalid credentials!')

        except mysql.connector.Error as e:
            flash(f'Database error: {e}')
        finally:
            if conn:
                conn.close()

    return render_template('admin_login.html')

# Route 3: Dashboard (Main Homepage)
@app.route('/dashboard')
def dashboard():
    """Main dashboard - shows stats and recent activity"""
    if not session.get('is_admin'):
        flash('Please login as admin to access the dashboard')
        return redirect(url_for('admin_login'))

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get dashboard statistics
        stats = {}

        # Total customers - using correct field from your schema
        cursor.execute("SELECT COUNT(*) FROM customers")
        stats['total_customers'] = cursor.fetchone()[0]

        # Total books (using assets table) - using correct field from your schema
        cursor.execute("SELECT COUNT(*) FROM assets")
        stats['total_books'] = cursor.fetchone()[0]

        # Total orders - using correct field from your schema
        cursor.execute("SELECT COUNT(*) FROM orders")
        stats['total_orders'] = cursor.fetchone()[0]

        # Total revenue - using correct field from your schema
        cursor.execute("SELECT COALESCE(SUM(total_value), 0) FROM orders")
        total_revenue = cursor.fetchone()[0]
        stats['total_revenue'] = safe_decimal_to_float(total_revenue)

        # Quote statistics
        cursor.execute("SELECT COUNT(*) FROM quotes WHERE status = 'pending'")
        stats['pending_quotes'] = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM quotes WHERE status = 'approved'")
        stats['approved_quotes'] = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM quotes WHERE status = 'rejected'")
        stats['rejected_quotes'] = cursor.fetchone()[0]



        # Processing orders (orders with order_date but no delivery_date)
        cursor.execute("""
            SELECT o.order_id, o.customer_name, o.asset_name,
                o.order_date, o.total_value, o.delivery_date, o.created_at,
                CASE
                    WHEN o.delivery_date IS NULL THEN 'NULL'
                    WHEN o.delivery_date = '0000-00-00' THEN 'ZERO_DATE'
                    ELSE 'HAS_DATE'
                END as delivery_status
            FROM orders o
            WHERE o.order_date IS NOT NULL AND (o.delivery_date IS NULL OR o.delivery_date = '0000-00-00')
            ORDER BY o.order_date DESC, o.order_id DESC
        """)
        processing_orders_raw = cursor.fetchall()
        processing_orders = []

        for row in processing_orders_raw:
            processing_orders.append({
                'order_id': row[0],
                'customer_name': row[1] or 'Unknown Customer',
                'asset_name': row[2] or 'Unknown Asset',
                'order_date': row[3],
                'total_value': safe_decimal_to_float(row[4]),
                'created_at': row[6]
            })


        # Customer account balances with last transaction info
        cursor.execute("""
            SELECT c.customer_name,
                COALESCE(SUM(CASE WHEN ca.transaction_type = 'debit' THEN ca.amount ELSE 0 END), 0) as total_debt,
                COALESCE(SUM(CASE WHEN ca.transaction_type = 'payment' THEN ca.amount ELSE 0 END), 0) as total_payments,
                COALESCE(SUM(CASE WHEN ca.transaction_type = 'credit' THEN ca.amount ELSE 0 END), 0) as total_credits,
                (COALESCE(SUM(CASE WHEN ca.transaction_type = 'debit' THEN ca.amount ELSE 0 END), 0) -
                    COALESCE(SUM(CASE WHEN ca.transaction_type = 'payment' THEN ca.amount ELSE 0 END), 0) -
                    COALESCE(SUM(CASE WHEN ca.transaction_type = 'credit' THEN ca.amount ELSE 0 END), 0)) as balance,
                (SELECT description FROM customer_accounts ca2
                    WHERE ca2.customer_id = c.customer_id
                    ORDER BY ca2.transaction_date DESC, ca2.created_at DESC
                    LIMIT 1) as last_description
            FROM customers c
            LEFT JOIN customer_accounts ca ON c.customer_id = ca.customer_id
            GROUP BY c.customer_id, c.customer_name
            HAVING balance != 0
            ORDER BY balance DESC
            LIMIT 10
        """)
        customer_balances_raw = cursor.fetchall()
        customer_balances = []

        for row in customer_balances_raw:
            customer_balances.append({
                'name': row[0],
                'total_debt': safe_decimal_to_float(row[1]),
                'total_payments': safe_decimal_to_float(row[2]),
                'total_credits': safe_decimal_to_float(row[3]),
                'balance': safe_decimal_to_float(row[4]),
                'last_description': row[5] or 'No description'
            })

        # Recent orders (last 5) - using correct fields from your schema
        cursor.execute("""
            SELECT o.order_id, o.customer_name, o.asset_name,
                o.order_date, o.total_value, o.payment_type,
                CASE WHEN o.asset_code IS NULL THEN 'quote-only' ELSE 'with-asset' END as order_type
            FROM orders o
            WHERE o.order_date IS NOT NULL
            ORDER BY o.order_date DESC, o.order_id DESC
            LIMIT 5
        """)
        recent_orders_raw = cursor.fetchall()
        recent_orders = []

        for row in recent_orders_raw:
            recent_orders.append({
                'id': row[0],
                'customer_name': row[1] or 'Unknown Customer',
                'book_title': row[2] or 'Unknown Book',
                'order_date': row[3],
                'amount': safe_decimal_to_float(row[4]),
                'status': row[5] or 'Pending',
                'order_type': row[6]
            })

        # Top customers by total spent - using correct fields from your schema
        cursor.execute("""
            SELECT customer_name, COUNT(order_id) as order_count,
                   COALESCE(SUM(total_value), 0) as total_spent
            FROM orders
            WHERE customer_name IS NOT NULL AND customer_name != ''
            GROUP BY customer_name
            HAVING total_spent > 0
            ORDER BY total_spent DESC
            LIMIT 5
        """)
        top_customers_raw = cursor.fetchall()
        top_customers = []

        for row in top_customers_raw:
            top_customers.append({
                'name': row[0],
                'order_count': row[1],
                'total_spent': safe_decimal_to_float(row[2])
            })

        # Current admin user info
        current_user = f"Admin ({session.get('admin_login')})"

        return render_template('dashboard.html',
                     stats=stats,
                     recent_orders=recent_orders,
                     top_customers=top_customers,
                     customer_balances=customer_balances,
                     processing_orders=processing_orders,
                     current_user=current_user)

    except Exception as e:
        print(f"Dashboard error: {e}")
        flash(f'Error loading dashboard: {e}')
        return redirect(url_for('admin_login'))
    finally:
        if conn:
            conn.close()

# Route 4: Admin Logout
@app.route('/admin/logout')
def admin_logout():
    """Admin logout - clears session"""
    session.pop('admin_id', None)
    session.pop('admin_login', None)
    session.pop('is_admin', None)
    flash('Logged out successfully!')
    return redirect(url_for('admin_login'))

@app.route('/customers', methods=['GET', 'POST'])
def customers():
    """Customers page - full CRUD operations"""
    if not session.get('is_admin'):
        flash('Please login as admin to access this page')
        return redirect(url_for('admin_login'))

    if request.method == 'POST':
        action = request.form.get('action')

        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            if action == 'add':
                # Add new customer
                customer_name = request.form['customer_name']
                customer_address = request.form.get('customer_address', '')
                customer_telephone = request.form.get('customer_telephone', '')
                customer_delivery_time = request.form.get('customer_delivery_time_request', '')

                cursor.execute("""
                    INSERT INTO customers (customer_name, customer_address, customer_telephone, customer_delivery_time_request)
                    VALUES (%s, %s, %s, %s)
                """, (customer_name, customer_address, customer_telephone, customer_delivery_time))

                conn.commit()
                flash(f'Customer "{customer_name}" added successfully!')

            elif action == 'edit':
                # Update existing customer
                customer_id = request.form['customer_id']
                customer_name = request.form['customer_name']
                customer_address = request.form.get('customer_address', '')
                customer_telephone = request.form.get('customer_telephone', '')
                customer_delivery_time = request.form.get('customer_delivery_time_request', '')

                cursor.execute("""
                    UPDATE customers
                    SET customer_name = %s, customer_address = %s, customer_telephone = %s,
                        customer_delivery_time_request = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE customer_id = %s
                """, (customer_name, customer_address, customer_telephone, customer_delivery_time, customer_id))

                conn.commit()
                flash(f'Customer "{customer_name}" updated successfully!')

            elif action == 'delete':
                # Delete customer with order check
                customer_id = request.form['customer_id']

                # First get customer name for flash message
                cursor.execute("SELECT customer_name FROM customers WHERE customer_id = %s", (customer_id,))
                customer = cursor.fetchone()
                customer_name = customer[0] if customer else 'Unknown'

                # Check if customer has any orders
                cursor.execute("SELECT COUNT(*) FROM orders WHERE customer_id = %s", (customer_id,))
                order_count = cursor.fetchone()[0]

                if order_count > 0:
                    flash(f'Cannot delete customer "{customer_name}" because they have {order_count} existing order(s). Please delete their orders first or contact system administrator.', 'error')
                else:
                    # Safe to delete customer
                    cursor.execute("DELETE FROM customers WHERE customer_id = %s", (customer_id,))
                    conn.commit()
                    flash(f'Customer "{customer_name}" deleted successfully!')

        except mysql.connector.Error as e:
            flash(f'Database error: {e}', 'error')
            if conn:
                conn.rollback()
        except Exception as e:
            flash(f'An error occurred: {e}', 'error')
            if conn:
                conn.rollback()
        finally:
            if conn:
                conn.close()

        return redirect(url_for('customers'))

    # GET request - show customers list
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get all customers with their order statistics
        cursor.execute("""
            SELECT
                c.customer_id, c.customer_name, c.customer_address,
                c.customer_telephone, c.customer_delivery_time_request, c.created_at,
                COUNT(o.order_id) as total_orders,
                COALESCE(SUM(o.total_value), 0) as total_spent,
                MAX(o.order_date) as last_order
            FROM customers c
            LEFT JOIN orders o ON c.customer_name = o.customer_name
            GROUP BY c.customer_id, c.customer_name, c.customer_address,
                     c.customer_telephone, c.customer_delivery_time_request, c.created_at
            ORDER BY c.customer_name
        """)
        customers_raw = cursor.fetchall()

        # Convert to list of dictionaries for easier template access
        customers = []
        for row in customers_raw:
            customers.append({
                'customer_id': row[0],
                'customer_name': row[1],
                'customer_address': row[2],
                'customer_telephone': row[3],
                'customer_delivery_time_request': row[4],
                'created_at': row[5],
                'total_orders': row[6],
                'total_spent': safe_decimal_to_float(row[7]),
                'last_order': row[8]
            })

        return render_template('customers.html', customers=customers, now=datetime.now().date)

    except Exception as e:
        flash(f'Error loading customers: {e}', 'error')
        return redirect(url_for('dashboard'))
    finally:
        if conn:
            conn.close()

@app.route('/books', methods=['GET', 'POST'])
def books():
    """Books/Assets page - full CRUD operations"""
    if not session.get('is_admin'):
        flash('Please login as admin to access this page')
        return redirect(url_for('admin_login'))

    if request.method == 'POST':
        action = request.form.get('action')

        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            if action == 'add':
                # Add new asset/book
                asset_name = request.form['asset_name']
                real_price = request.form.get('real', 0) or 0
                ienes_price = request.form.get('ienes', 0) or 0
                black_market = request.form.get('black', 0) or 0
                private = request.form.get('private', 0) or 0

                cursor.execute("""
                    INSERT INTO assets (asset_name, `real`, ienes, black, private)
                    VALUES (%s, %s, %s, %s, %s)
                """, (asset_name, real_price, ienes_price, black_market, private))

                conn.commit()
                flash(f'Book "{asset_name}" added successfully!')

            elif action == 'edit':
                # Update existing asset/book
                asset_code = request.form['asset_code']
                asset_name = request.form['asset_name']
                real_price = request.form.get('real', 0) or 0
                ienes_price = request.form.get('ienes', 0) or 0
                black_market = request.form.get('black', 0) or 0
                private = request.form.get('private', 0) or 0

                cursor.execute("""
                    UPDATE assets
                    SET asset_name = %s, `real` = %s, ienes = %s, black = %s,
                        private = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE asset_code = %s
                """, (asset_name, real_price, ienes_price, black_market, private, asset_code))

                conn.commit()
                flash(f'Book "{asset_name}" updated successfully!')

            elif action == 'delete':
                # Delete asset/book
                asset_code = request.form['asset_code']

                # First get asset name for flash message
                cursor.execute("SELECT asset_name FROM assets WHERE asset_code = %s", (asset_code,))
                asset = cursor.fetchone()
                asset_name = asset[0] if asset else 'Unknown'

                # Delete asset
                cursor.execute("DELETE FROM assets WHERE asset_code = %s", (asset_code,))
                conn.commit()
                flash(f'Book "{asset_name}" deleted successfully!')

        except mysql.connector.Error as e:
            flash(f'Database error: {e}')
        finally:
            if conn:
                conn.close()

        return redirect(url_for('books'))

    # GET request - show books/assets list
    try:
        conn = get_db_connection()
        cursor = conn.cursor()


        # Get all assets with their sales statistics and usage info
        cursor.execute("""
            SELECT
                a.asset_code, a.asset_name, a.real, a.ienes, a.black, a.private, a.created_at,
                COUNT(o.order_id) as times_sold,
                COALESCE(SUM(o.total_value), 0) as total_revenue,
                CASE WHEN COUNT(o.order_id) = 0 THEN 'unused' ELSE 'used' END as usage_status
            FROM assets a
            LEFT JOIN orders o ON a.asset_code = o.asset_code
            GROUP BY a.asset_code, a.asset_name, a.real, a.ienes, a.black, a.private, a.created_at
            ORDER BY times_sold DESC, a.asset_name
        """)
        assets_raw = cursor.fetchall()

        # Convert to list of dictionaries for easier template access
        books = []
        for row in assets_raw:
            books.append({
                'asset_code': row[0],
                'asset_name': row[1],
                'real': safe_decimal_to_float(row[2]),
                'ienes': row[3],
                'black': row[4],
                'private': row[5],
                'created_at': row[6],
                'times_sold': row[7],
                'total_revenue': safe_decimal_to_float(row[8]),
                'usage_status': row[9]
            })

        return render_template('books.html', books=books)

    except Exception as e:
        flash(f'Error loading books: {e}')
        return redirect(url_for('dashboard'))
    finally:
        if conn:
            conn.close()


@app.route('/orders', methods=['GET', 'POST'])
def orders():
    """Orders page - full CRUD operations with calculator integration and customer filtering"""
    if not session.get('is_admin'):
        flash('Please login as admin to access this page')
        return redirect(url_for('admin_login'))

    if request.method == 'POST':
        action = request.form.get('action')

        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            if action == 'add':
                # Add new order
                customer_name = request.form['customer_name']
                asset_name = request.form['asset_name']
                order_date = request.form['order_date']
                order_real = request.form.get('order_real', 0) or 0
                order_ien = request.form.get('order_ien', 0) or 0
                frete_brasil = request.form.get('frete_brasil', 0) or 0
                frete_jp = request.form.get('frete_jp', 0) or 0
                total_value = request.form.get('total_value', 0) or 0
                delivery_date = request.form.get('delivery_date') or None
                payment_type = request.form.get('payment_type', '')

                cursor.execute("""
                    INSERT INTO orders (customer_name, asset_name, order_date, order_real, order_ien,
                                      frete_brasil, frete_jp, total_value, delivery_date, payment_type)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (customer_name, asset_name, order_date, order_real, order_ien,
                     frete_brasil, frete_jp, total_value, delivery_date, payment_type))

                conn.commit()
                flash(f'Order for "{customer_name}" added successfully!')

            elif action == 'edit':
                # Update existing order
                order_id = request.form['order_id']
                customer_name = request.form['customer_name']
                asset_name = request.form['asset_name']
                order_date = request.form['order_date']
                order_real = request.form.get('order_real', 0) or 0
                order_ien = request.form.get('order_ien', 0) or 0
                frete_brasil = request.form.get('frete_brasil', 0) or 0
                frete_jp = request.form.get('frete_jp', 0) or 0
                total_value = request.form.get('total_value', 0) or 0
                delivery_date = request.form.get('delivery_date') or None
                payment_type = request.form.get('payment_type', '')

                cursor.execute("""
                    UPDATE orders
                    SET customer_name = %s, asset_name = %s, order_date = %s, order_real = %s,
                        order_ien = %s, frete_brasil = %s, frete_jp = %s, total_value = %s,
                        delivery_date = %s, payment_type = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE order_id = %s
                """, (customer_name, asset_name, order_date, order_real, order_ien,
                     frete_brasil, frete_jp, total_value, delivery_date, payment_type, order_id))

                conn.commit()
                flash(f'Order updated successfully!')

            elif action == 'delete':
                # Delete order
                order_id = request.form['order_id']

                # First get order info for flash message
                cursor.execute("SELECT customer_name FROM orders WHERE order_id = %s", (order_id,))
                order = cursor.fetchone()
                customer_name = order[0] if order else 'Unknown'

                # Delete order
                cursor.execute("DELETE FROM orders WHERE order_id = %s", (order_id,))
                conn.commit()
                flash(f'Order for "{customer_name}" deleted successfully!')

        except mysql.connector.Error as e:
            flash(f'Database error: {e}')
        finally:
            if conn:
                conn.close()

        # Preserve URL parameters when redirecting after POST operations
        return redirect(request.url if request.method == 'GET' else request.referrer or url_for('orders'))

    # GET request - show orders list with customers and assets for dropdowns
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get URL parameters for filtering
        customer_filter = request.args.get('customer', '').strip()
        sort_order = request.args.get('sort', 'recent')
        limit_results = request.args.get('limit', type=int)

        # Get all orders with pagination and filtering
        page = request.args.get('page', 1, type=int)
        per_page = 20 if not limit_results else limit_results
        offset = (page - 1) * per_page

        # Build the base query with optional customer filtering
        # Build the base query with optional customer filtering
        base_query = """
            SELECT o.order_id, o.customer_id, o.asset_code, o.customer_name, o.asset_name,
                o.order_date, o.order_real, o.order_ien, o.frete_brasil, o.frete_jp,
                o.total_value, o.delivery_date, o.payment_type, o.created_at,
                CASE WHEN o.asset_code IS NULL THEN 'quote-only' ELSE 'with-asset' END as source_type
            FROM orders o
        """

        where_conditions = []
        query_params = []

        # Add customer filter if specified
        if customer_filter:
            where_conditions.append("customer_name LIKE %s")
            query_params.append(f"%{customer_filter}%")

        # Add WHERE clause if there are conditions
        if where_conditions:
            base_query += " WHERE " + " AND ".join(where_conditions)

        # Add ORDER BY clause based on sort parameter
        if sort_order == 'recent':
            base_query += " ORDER BY order_date DESC, order_id DESC"
        elif sort_order == 'oldest':
            base_query += " ORDER BY order_date ASC, order_id ASC"
        else:
            base_query += " ORDER BY order_date DESC, order_id DESC"

        # Get total count for pagination (with same filters)
        count_query = "SELECT COUNT(*) FROM orders"
        if where_conditions:
            count_query += " WHERE " + " AND ".join(where_conditions)

        cursor.execute(count_query, query_params)
        total_orders = cursor.fetchone()[0]

        # Skip pagination if filtering by customer
        if customer_filter:
            final_query = base_query  # No LIMIT/OFFSET for customer filter
            final_params = query_params
        else:
            # Add LIMIT and OFFSET for pagination only when not filtering
            final_query = base_query + " LIMIT %s OFFSET %s"
            final_params = query_params + [per_page, offset]

        # Get orders for current page
        cursor.execute(final_query, final_params)
        orders_raw = cursor.fetchall()

        # Convert to list of dictionaries for easier template access
        orders = []
        for row in orders_raw:
            orders.append({
                'order_id': row[0],
                'customer_id': row[1],
                'asset_code': row[2],
                'customer_name': row[3],
                'asset_name': row[4],
                'order_date': row[5],
                'order_real': safe_decimal_to_float(row[6]),
                'order_ien': row[7],
                'frete_brasil': safe_decimal_to_float(row[8]),
                'frete_jp': safe_decimal_to_float(row[9]),
                'total_value': safe_decimal_to_float(row[10]),
                'delivery_date': row[11],
                'payment_type': row[12],
                'created_at': row[13],
                'source_type': row[14]
            })

        # Calculate pagination info (disable pagination when filtering by customer)
        if customer_filter:
            total_pages = 1
            has_prev = False
            has_next = False
            page = 1
        else:
            total_pages = (total_orders + per_page - 1) // per_page
            has_prev = page > 1
            has_next = page < total_pages

        # Get customers and assets for dropdown lists
        cursor.execute("SELECT DISTINCT customer_name FROM customers WHERE customer_name IS NOT NULL ORDER BY customer_name")
        customers = [row[0] for row in cursor.fetchall()]

        cursor.execute("SELECT DISTINCT asset_name FROM assets WHERE asset_name IS NOT NULL ORDER BY asset_name")
        assets = [row[0] for row in cursor.fetchall()]

        # Prepare filter info for template
        filter_info = {
            'customer_filter': customer_filter,
            'sort_order': sort_order,
            'is_filtered': bool(customer_filter),
            'limit_results': limit_results
        }

        return render_template('orders.html',
                             orders=orders,
                             customers=customers,
                             assets=assets,
                             page=page,
                             total_pages=total_pages,
                             has_prev=has_prev,
                             has_next=has_next,
                             total_orders=total_orders,
                             filter_info=filter_info)

    except Exception as e:
        print(f"ERROR in orders route: {e}")
        flash(f'Error loading orders: {e}')
        return redirect(url_for('dashboard'))
    finally:
        if conn:
            conn.close()


# Add these helper routes after your existing routes:

@app.route('/customers/<customer_name>/orders')
def customer_orders(customer_name):
    """View all orders for a specific customer"""
    if not session.get('is_admin'):
        flash('Please login as admin to access this page')
        return redirect(url_for('admin_login'))

    # Redirect to orders page with customer filter
    return redirect(url_for('orders', customer=customer_name, sort='recent'))

@app.route('/customers/<customer_name>/last-order')
def customer_last_order(customer_name):
    """View the last order for a specific customer"""
    if not session.get('is_admin'):
        flash('Please login as admin to access this page')
        return redirect(url_for('admin_login'))

    # Redirect to orders page with customer filter, recent sort, and limit to 1
    return redirect(url_for('orders', customer=customer_name, sort='recent', limit=1))

@app.route('/reports')
def reports():
    """Reports page - analytics and statistics"""
    if not session.get('is_admin'):
        flash('Please login as admin to access this page')
        return redirect(url_for('admin_login'))

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Key metrics for overview cards
        cursor.execute("SELECT COALESCE(SUM(total_value), 0) FROM orders")
        total_revenue = safe_decimal_to_float(cursor.fetchone()[0])

        cursor.execute("SELECT COUNT(*) FROM orders")
        total_orders = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(DISTINCT customer_name) FROM orders WHERE customer_name IS NOT NULL")
        active_customers = cursor.fetchone()[0]

        cursor.execute("SELECT COALESCE(AVG(total_value), 0) FROM orders WHERE total_value > 0")
        avg_order_value = safe_decimal_to_float(cursor.fetchone()[0])

        # Monthly sales report
        cursor.execute("""
            SELECT
                DATE_FORMAT(order_date, '%Y-%m') as month,
                COUNT(*) as total_orders,
                SUM(total_value) as total_revenue
            FROM orders
            WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(order_date, '%Y-%m')
            ORDER BY month ASC
        """)
        monthly_sales = cursor.fetchall()

        # Top selling books - showing both asset-based and quote-only orders
        cursor.execute("""
            SELECT o.asset_name, COUNT(*) as times_sold, SUM(o.total_value) as revenue,
                COUNT(CASE WHEN o.asset_code IS NOT NULL THEN 1 END) as from_assets,
                COUNT(CASE WHEN o.asset_code IS NULL THEN 1 END) as from_quotes
            FROM orders o
            WHERE o.asset_name IS NOT NULL
            GROUP BY o.asset_name
            ORDER BY times_sold DESC
            LIMIT 10
        """)
        top_books = cursor.fetchall()

        # Customer analytics
        cursor.execute("""
            SELECT customer_name, COUNT(*) as orders, SUM(total_value) as total_spent
            FROM orders
            WHERE customer_name IS NOT NULL
            GROUP BY customer_name
            ORDER BY total_spent DESC
            LIMIT 10
        """)
        top_customers = cursor.fetchall()

        # Recent activity metrics
        cursor.execute("""
            SELECT COUNT(*) FROM orders
            WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        """)
        recent_orders_count = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COUNT(*) FROM customers
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        """)
        new_customers_count = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COALESCE(SUM(total_value), 0) FROM orders
            WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        """)
        weekly_revenue = safe_decimal_to_float(cursor.fetchone()[0])

        cursor.execute("""
            SELECT COUNT(*) FROM assets
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        """)
        assets_added_count = cursor.fetchone()[0]


        # Orders by status
        cursor.execute("""
            SELECT order_id, customer_name, asset_name, order_date, delivery_date,
                total_value, payment_type, order_real, order_ien, frete_brasil, frete_jp,
                CASE
                    WHEN delivery_date IS NOT NULL THEN 'DELIVERED'
                    WHEN order_date IS NOT NULL THEN 'PROCESSING'
                    ELSE 'PENDING'
                END as status
            FROM orders
            WHERE order_date IS NOT NULL
            ORDER BY
                CASE
                    WHEN delivery_date IS NOT NULL THEN 1
                    WHEN order_date IS NOT NULL THEN 2
                    ELSE 3
                END,
                order_date DESC
        """)
        orders_by_status_raw = cursor.fetchall()
        orders_by_status = []

        for row in orders_by_status_raw:
            orders_by_status.append({
                'order_id': row[0],
                'customer_name': row[1],
                'asset_name': row[2],
                'order_date': row[3],
                'delivery_date': row[4],
                'total_value': safe_decimal_to_float(row[5]),
                'payment_type': row[6],
                'order_real': safe_decimal_to_float(row[7]),
                'order_ien': row[8],
                'frete_brasil': safe_decimal_to_float(row[9]),
                'frete_jp': safe_decimal_to_float(row[10]),
                'status': row[11]
            })

        # Debug: Print the orders data
        print(f"DEBUG: Found {len(orders_by_status)} orders by status")
        for order in orders_by_status[:3]:  # Print first 3 orders
            print(f"DEBUG: Order {order['order_id']} - Status: {order['status']} - Customer: {order['customer_name']}")

        # Get customers and assets for dropdown lists (same as in orders route)
        cursor.execute("SELECT DISTINCT customer_name FROM customers WHERE customer_name IS NOT NULL ORDER BY customer_name")
        customers = [row[0] for row in cursor.fetchall()]

        cursor.execute("SELECT DISTINCT asset_name FROM assets WHERE asset_name IS NOT NULL ORDER BY asset_name")
        assets = [row[0] for row in cursor.fetchall()]


        return render_template('reports.html',
                            # Key metrics
                            total_revenue=total_revenue,
                            total_orders=total_orders,
                            active_customers=active_customers,
                            avg_order_value=avg_order_value,
                            # Charts data
                            monthly_sales=monthly_sales,
                            top_books=top_books,
                            top_customers=top_customers,
                            # Recent activity
                            recent_orders_count=recent_orders_count,
                            new_customers_count=new_customers_count,
                            weekly_revenue=weekly_revenue,
                            assets_added_count=assets_added_count,
                            orders_by_status=orders_by_status,
                            # Add these new variables
                            customers=customers,
                            assets=assets)


    except Exception as e:
        flash(f'Error loading reports: {e}')
        return redirect(url_for('dashboard'))
    finally:
        if conn:
            conn.close()

@app.route('/search')
def search():
    """Search page - global search across all entities"""
    if not session.get('is_admin'):
        flash('Please login as admin to access this page')
        return redirect(url_for('admin_login'))

    query = request.args.get('q', '').strip()
    search_type = request.args.get('type', 'all')

    results = {
        'customers': [],
        'books': [],
        'orders': []
    }

    if query:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            search_term = f"%{query}%"

            if search_type in ['all', 'customers']:
                # Search customers
                cursor.execute("""
                    SELECT customer_id, customer_name, customer_address, customer_telephone
                    FROM customers
                    WHERE customer_name LIKE %s OR customer_address LIKE %s OR customer_telephone LIKE %s
                    LIMIT 20
                """, (search_term, search_term, search_term))
                results['customers'] = cursor.fetchall()

            if search_type in ['all', 'books']:
                # Search books/assets
                cursor.execute("""
                    SELECT asset_code, asset_name, real, ienes
                    FROM assets
                    WHERE asset_name LIKE %s
                    LIMIT 20
                """, (search_term,))
                results['books'] = cursor.fetchall()

            if search_type in ['all', 'orders']:
                # Search orders
                cursor.execute("""
                    SELECT order_id, customer_name, asset_name, order_date, total_value
                    FROM orders
                    WHERE customer_name LIKE %s OR asset_name LIKE %s
                    ORDER BY order_date DESC
                    LIMIT 20
                """, (search_term, search_term))
                results['orders'] = cursor.fetchall()

        except Exception as e:
            flash(f'Search error: {e}')
        finally:
            if conn:
                conn.close()

    return render_template('search.html',
                         query=query,
                         search_type=search_type,
                         results=results)


@app.route('/create_order')
def create_order():
    """Create order page - calculator functionality with quotes workflow"""
    if not session.get('is_admin'):
        flash('Please login as admin to access this page')
        return redirect(url_for('admin_login'))

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get pending quotes count for display
        cursor.execute("SELECT COUNT(*) FROM quotes WHERE status = 'pending'")
        pending_quotes_count = cursor.fetchone()[0]

        # Get recent quotes for quick reference
        cursor.execute("""
            SELECT quote_id, customer_name, book_title, total_jpy, created_at
            FROM quotes
            WHERE status = 'pending'
            ORDER BY created_at DESC
            LIMIT 5
        """)
        recent_quotes = cursor.fetchall()

        return render_template('create_order.html',
                             pending_quotes_count=pending_quotes_count,
                             recent_quotes=recent_quotes)

    except Exception as e:
        flash(f'Error loading create order page: {e}')
        return redirect(url_for('dashboard'))
    finally:
        if conn:
            conn.close()

@app.route('/api/calculate', methods=['POST'])
def api_calculate():
    """API endpoint for book import calculations"""
    if not session.get('is_admin'):
        return jsonify({'success': False, 'error': 'Authentication required'}), 401

    try:
        data = request.get_json()
        print(f"Calculate API called with data: {data}")  # Debug line

        # Validate required fields
        if not data.get('book_price') or not data.get('shipping_cost'):
            return jsonify({'success': False, 'error': 'Book price and shipping cost are required'}), 400

        book_price = float(data['book_price'])
        shipping_cost = float(data['shipping_cost'])
        profit_percent = float(data.get('profit_percent', 30))
        shipping_adjustment_jpy = float(data.get('shipping_adjustment_jpy', 0))

        # Calculate profit
        profit = book_price * (profit_percent / 100)

        # Calculate total in BRL
        total_brl = book_price + profit + shipping_cost

        # Get current exchange rate
        exchange_rate, rate_source = get_exchange_rate()

        # Convert to JPY
        total_jpy_before_adjustment = total_brl * exchange_rate

        # Add shipping adjustment
        total_jpy = total_jpy_before_adjustment + shipping_adjustment_jpy

        result = {
            'success': True,
            'book_price': book_price,
            'profit': profit,
            'profit_percent': profit_percent,
            'shipping_cost': shipping_cost,
            'total_brl': total_brl,
            'shipping_adjustment_jpy': shipping_adjustment_jpy,
            'total_jpy': int(round(total_jpy)),
            'exchange_rate': exchange_rate,
            'rate_source': rate_source
        }

        print(f"Calculate API returning: {result}")  # Debug line

        # Save calculation to calculations table (optional)
        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            # Insert calculation into calculations table if it exists
            cursor.execute("""
                INSERT INTO calculations (
                    customer_name, book_title, book_price, profit_percent, profit,
                    shipping_cost, shipping_adjustment_jpy, total_brl, total_jpy,
                    exchange_rate, rate_source, admin_id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                data.get('customer_name', ''),
                data.get('book_title', ''),
                book_price,
                profit_percent,
                profit,
                shipping_cost,
                shipping_adjustment_jpy,
                total_brl,
                int(round(total_jpy)),
                exchange_rate,
                rate_source,
                session.get('admin_id')
            ))

            conn.commit()

        except mysql.connector.Error as e:
            # If calculations table doesn't exist, just continue
            print(f"Note: Could not save to calculations table: {e}")
        finally:
            if conn:
                conn.close()

        response = jsonify(result)
        response.headers['Content-Type'] = 'application/json'
        return response

    except ValueError as e:
        print(f"ValueError in calculate API: {e}")
        return jsonify({'success': False, 'error': 'Invalid numeric values provided'}), 400
    except Exception as e:
        print(f"General error in calculate API: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/exchange-rate')
def api_exchange_rate():
    """API endpoint for getting current BRL to JPY exchange rate"""
    try:
        rate, source = get_exchange_rate()
        return jsonify({
            'success': True,
            'rate': rate,
            'source': source
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'rate': 30.0,  # Fallback rate
            'source': 'Fallback'
        })



@app.route('/api/save-order-legacy', methods=['POST'])
def api_save_order_legacy():
    """API endpoint to save a calculation as an actual order (updated version)"""
    if not session.get('is_admin'):
        return jsonify({'success': False, 'error': 'Authentication required'}), 401

    conn = None
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['customer_name', 'book_title', 'total_value_jpy']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'{field} is required'})

        # Sanitize input data
        customer_name = str(data['customer_name']).strip()
        book_title = str(data['book_title']).strip()

        if not customer_name or not book_title:
            return jsonify({'success': False, 'error': 'Customer name and book title cannot be empty'})

        # Validate numeric fields
        try:
            book_price = float(data.get('book_price', 0))
            shipping_cost = float(data.get('shipping_cost', 0))
            shipping_adjustment_jpy = float(data.get('shipping_adjustment_jpy', 0))
            total_value_jpy = float(data.get('total_value_jpy', 0))

            if total_value_jpy <= 0:
                return jsonify({'success': False, 'error': 'Total value must be greater than 0'})

        except (ValueError, TypeError):
            return jsonify({'success': False, 'error': 'Invalid numeric values provided'})

        conn = get_db_connection()
        cursor = conn.cursor()

        # Start transaction
        conn.start_transaction()

        # Handle customer
        cursor.execute("SELECT customer_id FROM customers WHERE customer_name = %s", (customer_name,))
        customer_result = cursor.fetchone()

        if not customer_result:
            # Create new customer
            cursor.execute("""
                INSERT INTO customers (customer_name, customer_address, customer_telephone, customer_delivery_time_request)
                VALUES (%s, %s, %s, %s)
            """, (customer_name, '', '', ''))

            # Get the customer ID
            customer_id = cursor.lastrowid
        else:
            customer_id = customer_result[0]


        # Handle asset - check if exists, but don't create automatically
        cursor.execute("SELECT asset_code FROM assets WHERE asset_name = %s", (book_title,))
        asset_result = cursor.fetchone()

        if asset_result:
            asset_code = asset_result[0]
        else:
            asset_code = None

        # Insert new order
        cursor.execute("""
            INSERT INTO orders (
                customer_id,
                asset_code,
                customer_name,
                asset_name,
                order_date,
                order_real,
                order_ien,
                frete_brasil,
                frete_jp,
                total_value,
                payment_type
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            customer_id,                               # customer_id (FK)
            asset_code,                                # asset_code (FK)
            customer_name,                             # customer_name (text backup)
            book_title,                                # asset_name (text backup)
            datetime.now().date(),                     # order_date
            book_price,                                # order_real (BRL book price)
            total_value_jpy,                          # order_ien (JPY total)
            shipping_cost,                            # frete_brasil (BRL shipping)
            shipping_adjustment_jpy,                  # frete_jp (JPY shipping adjustment)
            total_value_jpy,                          # total_value (JPY final total)
            'Quote Approved'                          # payment_type
        ))

        # Commit the transaction
        conn.commit()
        order_id = cursor.lastrowid

        return jsonify({
            'success': True,
            'message': 'Order created successfully from quote',
            'order_id': order_id,
            'customer_id': customer_id,
            'asset_code': asset_code
        })

    except mysql.connector.IntegrityError as e:
        if conn:
            conn.rollback()
        print(f"MySQL Integrity Error: {e}")
        return jsonify({
            'success': False,
            'error': f'Database integrity error: {str(e)}'
        })

    except mysql.connector.Error as e:
        if conn:
            conn.rollback()
        print(f"MySQL error: {e}")
        return jsonify({
            'success': False,
            'error': f'Database error: {str(e)}'
        })

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"General error: {e}")
        return jsonify({
            'success': False,
            'error': f'Unexpected error: {str(e)}'
        })

    finally:
        if conn:
            conn.close()



# Optional: Create calculations history table (run this once)
def create_calculations_table():
    """
    Create a table to store calculation history
    Run this function once to create the table
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS calculations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_name VARCHAR(100),
                book_title VARCHAR(200),
                book_price DECIMAL(10,2),
                profit_percent DECIMAL(5,2),
                profit DECIMAL(10,2),
                shipping_cost DECIMAL(10,2),
                shipping_adjustment_jpy INT,
                total_brl DECIMAL(10,2),
                total_jpy INT,
                exchange_rate DECIMAL(10,4),
                rate_source VARCHAR(50),
                admin_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_id) REFERENCES login(id)
            )
        """)

        conn.commit()
        print("Calculations table created successfully")

    except mysql.connector.Error as e:
        print(f"Error creating calculations table: {e}")
    finally:
        if conn:
            conn.close()

@app.route('/api/create-customer', methods=['POST'])
def api_create_customer():
    """API endpoint to create a new customer from calculator"""
    if not session.get('is_admin'):
        return jsonify({'success': False, 'error': 'Authentication required'}), 401

    try:
        data = request.get_json()
        customer_name = data.get('customer_name', '').strip()

        if not customer_name:
            return jsonify({'success': False, 'error': 'Customer name is required'})

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if customer already exists
        cursor.execute("SELECT customer_id FROM customers WHERE customer_name = %s", (customer_name,))
        if cursor.fetchone():
            return jsonify({'success': False, 'error': 'Customer already exists'})

        # Insert new customer
        cursor.execute("""
            INSERT INTO customers (customer_name)
            VALUES (%s)
        """, (customer_name,))

        conn.commit()
        customer_id = cursor.lastrowid

        return jsonify({
            'success': True,
            'message': 'Customer created successfully',
            'customer_id': customer_id,
            'customer_name': customer_name
        })

    except mysql.connector.Error as e:
        return jsonify({'success': False, 'error': f'Database error: {e}'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        if conn:
            conn.close()


@app.route('/api/calculations-history')
def api_calculations_history():
    """API endpoint to get calculation history"""
    if not session.get('is_admin'):
        return jsonify({'success': False, 'error': 'Authentication required'}), 401

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get recent calculations
        cursor.execute("""
            SELECT customer_name, book_title, book_price, profit_percent, profit,
                   shipping_cost, shipping_adjustment_jpy, total_brl, total_jpy,
                   exchange_rate, rate_source, created_at
            FROM calculations
            WHERE admin_id = %s
            ORDER BY created_at DESC
            LIMIT 50
        """, (session.get('admin_id'),))

        calculations_raw = cursor.fetchall()
        calculations = []

        for row in calculations_raw:
            calculations.append({
                'customer_name': row[0],
                'book_title': row[1],
                'book_price': safe_decimal_to_float(row[2]),
                'profit_percent': safe_decimal_to_float(row[3]),
                'profit': safe_decimal_to_float(row[4]),
                'shipping_cost': safe_decimal_to_float(row[5]),
                'shipping_adjustment_jpy': row[6],
                'total_brl': safe_decimal_to_float(row[7]),
                'total_jpy': row[8],
                'exchange_rate': safe_decimal_to_float(row[9]),
                'rate_source': row[10],
                'created_at': row[11].isoformat() if row[11] else None
            })

        return jsonify({
            'success': True,
            'calculations': calculations
        })

    except mysql.connector.Error as e:
        return jsonify({'success': False, 'error': f'Database error: {e}'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        if conn:
            conn.close()


@app.route('/api/create-asset', methods=['POST'])
def api_create_asset():
    """API endpoint to create a new asset from calculator"""
    if not session.get('is_admin'):
        return jsonify({'success': False, 'error': 'Authentication required'}), 401

    try:
        data = request.get_json()
        asset_name = data.get('asset_name', '').strip()
        book_price = data.get('book_price', 0)

        if not asset_name:
            return jsonify({'success': False, 'error': 'Asset name is required'})

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if asset already exists
        cursor.execute("SELECT asset_code FROM assets WHERE asset_name = %s", (asset_name,))
        if cursor.fetchone():
            return jsonify({'success': False, 'error': 'Asset already exists'})

        # Insert new asset - using backticks around 'real' since it's a reserved word
        cursor.execute("""
            INSERT INTO assets (asset_name, `real`)
            VALUES (%s, %s)
        """, (asset_name, book_price))

        conn.commit()
        asset_code = cursor.lastrowid

        return jsonify({
            'success': True,
            'message': 'Asset created successfully',
            'asset_code': asset_code,
            'asset_name': asset_name
        })

    except mysql.connector.Error as e:
        return jsonify({'success': False, 'error': f'Database error: {e}'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        if conn:
            conn.close()

@app.route('/api/customers')
def api_customers():
    """API endpoint to get customers list"""
    if not session.get('is_admin'):
        return jsonify({'success': False, 'error': 'Authentication required'}), 401

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get distinct customer names from customers table
        cursor.execute("SELECT DISTINCT customer_name FROM customers WHERE customer_name IS NOT NULL AND customer_name != '' ORDER BY customer_name")
        customers_raw = cursor.fetchall()
        customers = [row[0] for row in customers_raw]

        return jsonify({
            'success': True,
            'customers': customers
        })

    except mysql.connector.Error as e:
        return jsonify({'success': False, 'error': f'Database error: {e}'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        if conn:
            conn.close()


@app.route('/api/assets')
def api_assets():
    """API endpoint to get assets list with prices"""
    if not session.get('is_admin'):
        return jsonify({'success': False, 'error': 'Authentication required'}), 401

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get asset names and prices from assets table
        cursor.execute("SELECT asset_name, `real` FROM assets WHERE asset_name IS NOT NULL AND asset_name != '' ORDER BY asset_name")
        assets_raw = cursor.fetchall()

        # Convert to list of dictionaries with name and price
        assets = []
        for row in assets_raw:
            assets.append({
                'name': row[0],
                'price': float(row[1]) if row[1] else 0.0
            })

        print(f"API assets called - returning {len(assets)} assets with prices")

        response = jsonify({
            'success': True,
            'assets': assets
        })
        response.headers['Content-Type'] = 'application/json'
        return response

    except mysql.connector.Error as e:
        print(f"Database error in api_assets: {e}")
        return jsonify({'success': False, 'error': f'Database error: {e}'}), 500
    except Exception as e:
        print(f"General error in api_assets: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/orders')
def api_orders():
    """API endpoint to get orders with pagination"""
    if not session.get('is_admin'):
        return jsonify({'success': False, 'error': 'Authentication required'}), 401

    try:
        page = request.args.get('page', 1, type=int)
        per_page = 20
        offset = (page - 1) * per_page

        conn = get_db_connection()
        cursor = conn.cursor()

        # Get total count for pagination
        cursor.execute("SELECT COUNT(*) FROM orders")
        total_orders = cursor.fetchone()[0]

        # Get orders for current page
        cursor.execute("""
            SELECT order_id, customer_id, asset_code, customer_name, asset_name,
                   order_date, order_real, order_ien, frete_brasil, frete_jp,
                   total_value, delivery_date, payment_type, created_at
            FROM orders
            ORDER BY order_date DESC, order_id DESC
            LIMIT %s OFFSET %s
        """, (per_page, offset))

        orders_raw = cursor.fetchall()
        orders = []

        for row in orders_raw:
            orders.append({
                'order_id': row[0],
                'customer_id': row[1],
                'asset_code': row[2],
                'customer_name': row[3],
                'asset_name': row[4],
                'order_date': row[5].isoformat() if row[5] else None,
                'order_real': safe_decimal_to_float(row[6]),
                'order_ien': row[7],
                'frete_brasil': safe_decimal_to_float(row[8]),
                'frete_jp': safe_decimal_to_float(row[9]),
                'total_value': safe_decimal_to_float(row[10]),
                'delivery_date': row[11].isoformat() if row[11] else None,
                'payment_type': row[12],
                'created_at': row[13].isoformat() if row[13] else None
            })

        # Calculate pagination info
        total_pages = (total_orders + per_page - 1) // per_page

        return jsonify({
            'success': True,
            'orders': orders,
            'page': page,
            'total_pages': total_pages,
            'has_prev': page > 1,
            'has_next': page < total_pages,
            'total_orders': total_orders
        })

    except mysql.connector.Error as e:
        return jsonify({'success': False, 'error': f'Database error: {e}'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        if conn:
            conn.close()


# Add these new API endpoints to your app.py file after the existing API routes

@app.route('/api/save-quote', methods=['POST'])
def api_save_quote():
    """API endpoint to save a calculation as a quote (not an order)"""
    if not session.get('is_admin'):
        return jsonify({'success': False, 'error': 'Authentication required'}), 401

    conn = None
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['customer_name', 'book_title', 'total_jpy']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'{field} is required'})

        # Sanitize input data
        customer_name = str(data['customer_name']).strip()
        book_title = str(data['book_title']).strip()

        if not customer_name or not book_title:
            return jsonify({'success': False, 'error': 'Customer name and book title cannot be empty'})

        # Validate numeric fields
        try:
            book_price = float(data.get('book_price', 0))
            profit_percent = float(data.get('profit_percent', 30))
            profit = float(data.get('profit', 0))
            shipping_cost = float(data.get('shipping_cost', 0))
            shipping_adjustment_jpy = float(data.get('shipping_adjustment_jpy', 0))
            total_brl = float(data.get('total_brl', 0))
            total_jpy = float(data.get('total_jpy', 0))
            exchange_rate = float(data.get('exchange_rate', 30))
            rate_source = str(data.get('rate_source', 'Unknown'))

            if total_jpy <= 0:
                return jsonify({'success': False, 'error': 'Total value must be greater than 0'})

        except (ValueError, TypeError):
            return jsonify({'success': False, 'error': 'Invalid numeric values provided'})

        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert new quote
        cursor.execute("""
            INSERT INTO quotes (
                customer_name,
                book_title,
                book_price,
                profit_percent,
                profit,
                shipping_cost,
                shipping_adjustment_jpy,
                total_brl,
                total_jpy,
                exchange_rate,
                rate_source,
                status,
                admin_id
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            customer_name,
            book_title,
            book_price,
            profit_percent,
            profit,
            shipping_cost,
            shipping_adjustment_jpy,
            total_brl,
            total_jpy,
            exchange_rate,
            rate_source,
            'pending',
            session.get('admin_id')
        ))

        conn.commit()
        quote_id = cursor.lastrowid

        return jsonify({
            'success': True,
            'message': 'Quote created successfully',
            'quote_id': quote_id
        })

    except mysql.connector.Error as e:
        if conn:
            conn.rollback()
        print(f"MySQL error in save quote: {e}")
        return jsonify({
            'success': False,
            'error': f'Database error: {str(e)}'
        })

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"General error in save quote: {e}")
        return jsonify({
            'success': False,
            'error': f'Unexpected error: {str(e)}'
        })

    finally:
        if conn:
            conn.close()


@app.route('/api/quotes/<int:quote_id>/approve', methods=['POST'])
def api_approve_quote(quote_id):
    """API endpoint to approve a quote and convert it to an order"""
    if not session.get('is_admin'):
        return jsonify({'success': False, 'error': 'Authentication required'}), 401

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Start transaction
        conn.start_transaction()

        # Get the quote details
        cursor.execute("""
            SELECT customer_name, book_title, book_price, profit_percent, profit,
                   shipping_cost, shipping_adjustment_jpy, total_brl, total_jpy,
                   exchange_rate, rate_source
            FROM quotes
            WHERE quote_id = %s AND status = 'pending'
        """, (quote_id,))

        quote = cursor.fetchone()
        if not quote:
            return jsonify({'success': False, 'error': 'Quote not found or already processed'})

        customer_name, book_title, book_price, profit_percent, profit, shipping_cost, shipping_adjustment_jpy, total_brl, total_jpy, exchange_rate, rate_source = quote

        # Handle customer - check if exists, create if not
        cursor.execute("SELECT customer_id FROM customers WHERE customer_name = %s", (customer_name,))
        customer_result = cursor.fetchone()

        if not customer_result:
            # Create new customer
            cursor.execute("""
                INSERT INTO customers (customer_name, customer_address, customer_telephone, customer_delivery_time_request)
                VALUES (%s, %s, %s, %s)
            """, (customer_name, '', '', ''))
            customer_id = cursor.lastrowid
        else:
            customer_id = customer_result[0]


        # Handle asset - check if exists, but don't create automatically
        cursor.execute("SELECT asset_code FROM assets WHERE asset_name = %s", (book_title,))
        asset_result = cursor.fetchone()

        asset_code = asset_result[0] if asset_result else None

        # If asset exists, we'll remove it from assets table after creating the order
        # since it's now sold and no longer in stock
        should_remove_asset = asset_result is not None

        if asset_result:
            asset_code = asset_result[0]
            # Asset exists - we'll use it for the order but won't modify it
        else:
            # Asset doesn't exist - we'll create order without asset_code
            asset_code = None

        # Create the order (with or without asset_code)
        cursor.execute("""
            INSERT INTO orders (
                customer_id,
                asset_code,
                customer_name,
                asset_name,
                order_date,
                order_real,
                order_ien,
                frete_brasil,
                frete_jp,
                total_value,
                payment_type
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            customer_id,
            asset_code,  # This can be None now
            customer_name,
            book_title,
            datetime.now().date(),
            book_price,
            total_jpy,
            shipping_cost,
            shipping_adjustment_jpy,
            total_jpy,
            'Quote Approved'
        ))

        order_id = cursor.lastrowid

        # Remove asset from assets table if it existed (since it's now sold)
        if should_remove_asset:
            cursor.execute("DELETE FROM assets WHERE asset_code = %s", (asset_code,))


        # Update quote status to approved
        cursor.execute("""
            UPDATE quotes
            SET status = 'approved', updated_at = CURRENT_TIMESTAMP
            WHERE quote_id = %s
        """, (quote_id,))

        # Commit the transaction
        conn.commit()

        return jsonify({
            'success': True,
            'message': 'Quote approved and converted to order successfully',
            'order_id': order_id,
            'customer_id': customer_id,
            'asset_code': asset_code
        })

    except mysql.connector.Error as e:
        if conn:
            conn.rollback()
        print(f"MySQL error in approve quote: {e}")
        return jsonify({
            'success': False,
            'error': f'Database error: {str(e)}'
        })

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"General error in approve quote: {e}")
        return jsonify({
            'success': False,
            'error': f'Unexpected error: {str(e)}'
        })

    finally:
        if conn:
            conn.close()


@app.route('/api/quotes/<int:quote_id>/reject', methods=['DELETE'])
def api_reject_quote(quote_id):
    """API endpoint to reject and delete a quote"""
    if not session.get('is_admin'):
        return jsonify({'success': False, 'error': 'Authentication required'}), 401

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if quote exists and is pending
        cursor.execute("""
            SELECT customer_name FROM quotes
            WHERE quote_id = %s AND status = 'pending'
        """, (quote_id,))

        quote = cursor.fetchone()
        if not quote:
            return jsonify({'success': False, 'error': 'Quote not found or already processed'})

        customer_name = quote[0]

        # Update quote status to rejected (or delete it completely)
        cursor.execute("""
            UPDATE quotes
            SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
            WHERE quote_id = %s
        """, (quote_id,))

        # Alternatively, if you want to completely delete the quote:
        # cursor.execute("DELETE FROM quotes WHERE quote_id = %s", (quote_id,))

        conn.commit()

        return jsonify({
            'success': True,
            'message': f'Quote for "{customer_name}" rejected successfully'
        })

    except mysql.connector.Error as e:
        return jsonify({'success': False, 'error': f'Database error: {e}'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        if conn:
            conn.close()


# Update the existing api_save_order function to remove it or rename it
# Since we now have quotes, the old direct order creation should be removed
# or renamed to avoid confusion

@app.route('/api/save-order-direct', methods=['POST'])
def api_save_order_direct():
    """API endpoint to save an order directly (bypass quotes) - for manual order creation"""
    if not session.get('is_admin'):
        return jsonify({'success': False, 'error': 'Authentication required'}), 401

    # Keep the existing api_save_order logic here for direct order creation
    # This can be used for manual order entry that bypasses the quote system

    conn = None
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['customer_name', 'book_title', 'total_value_jpy']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'{field} is required'})

        # Sanitize input data
        customer_name = str(data['customer_name']).strip()
        book_title = str(data['book_title']).strip()

        if not customer_name or not book_title:
            return jsonify({'success': False, 'error': 'Customer name and book title cannot be empty'})

        # Validate numeric fields
        try:
            book_price = float(data.get('book_price', 0))
            shipping_cost = float(data.get('shipping_cost', 0))
            shipping_adjustment_jpy = float(data.get('shipping_adjustment_jpy', 0))
            total_value_jpy = float(data.get('total_value_jpy', 0))

            if total_value_jpy <= 0:
                return jsonify({'success': False, 'error': 'Total value must be greater than 0'})

        except (ValueError, TypeError):
            return jsonify({'success': False, 'error': 'Invalid numeric values provided'})

        conn = get_db_connection()
        cursor = conn.cursor()

        # Start transaction
        conn.start_transaction()

        # Handle customer
        cursor.execute("SELECT customer_id FROM customers WHERE customer_name = %s", (customer_name,))
        customer_result = cursor.fetchone()

        if not customer_result:
            # Create new customer
            cursor.execute("""
                INSERT INTO customers (customer_name, customer_address, customer_telephone, customer_delivery_time_request)
                VALUES (%s, %s, %s, %s)
            """, (customer_name, '', '', ''))

            customer_id = cursor.lastrowid
        else:
            customer_id = customer_result[0]


        # Handle asset - check if exists, but don't create automatically
        cursor.execute("SELECT asset_code FROM assets WHERE asset_name = %s", (book_title,))
        asset_result = cursor.fetchone()

        if asset_result:
            asset_code = asset_result[0]
        else:
            asset_code = None

        # Insert new order
        cursor.execute("""
            INSERT INTO orders (
                customer_id,
                asset_code,
                customer_name,
                asset_name,
                order_date,
                order_real,
                order_ien,
                frete_brasil,
                frete_jp,
                total_value,
                payment_type
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            customer_id,
            asset_code,
            customer_name,
            book_title,
            datetime.now().date(),
            book_price,
            total_value_jpy,
            shipping_cost,
            shipping_adjustment_jpy,
            total_value_jpy,
            'Direct Order'
        ))

        # Commit the transaction
        conn.commit()
        order_id = cursor.lastrowid

        return jsonify({
            'success': True,
            'message': 'Order created successfully',
            'order_id': order_id,
            'customer_id': customer_id,
            'asset_code': asset_code
        })

    except mysql.connector.IntegrityError as e:
        if conn:
            conn.rollback()
        print(f"MySQL Integrity Error: {e}")
        return jsonify({
            'success': False,
            'error': f'Database integrity error: {str(e)}'
        })

    except mysql.connector.Error as e:
        if conn:
            conn.rollback()
        print(f"MySQL error: {e}")
        return jsonify({
            'success': False,
            'error': f'Database error: {str(e)}'
        })

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"General error: {e}")
        return jsonify({
            'success': False,
            'error': f'Unexpected error: {str(e)}'
        })

    finally:
        if conn:
            conn.close()


@app.route('/api/quotes')
def api_quotes():
    """API endpoint to get pending quotes"""
    if not session.get('is_admin'):
        return jsonify({'success': False, 'error': 'Authentication required'}), 401

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get all pending quotes
        cursor.execute("""
            SELECT quote_id, customer_name, book_title, book_price, profit_percent, profit,
                   shipping_cost, shipping_adjustment_jpy, total_brl, total_jpy,
                   exchange_rate, rate_source, status, created_at
            FROM quotes
            WHERE status = 'pending'
            ORDER BY created_at DESC
        """)

        quotes_raw = cursor.fetchall()
        quotes = []

        for row in quotes_raw:
            quotes.append({
                'quote_id': row[0],
                'customer_name': row[1],
                'book_title': row[2],
                'book_price': safe_decimal_to_float(row[3]),
                'profit_percent': safe_decimal_to_float(row[4]),
                'profit': safe_decimal_to_float(row[5]),
                'shipping_cost': safe_decimal_to_float(row[6]),
                'shipping_adjustment_jpy': row[7],
                'total_brl': safe_decimal_to_float(row[8]),
                'total_jpy': row[9],
                'exchange_rate': safe_decimal_to_float(row[10]),
                'rate_source': row[11],
                'status': row[12],
                'created_at': row[13].isoformat() if row[13] else None
            })

        return jsonify({
            'success': True,
            'quotes': quotes
        })

    except mysql.connector.Error as e:
        return jsonify({'success': False, 'error': f'Database error: {e}'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        if conn:
            conn.close()


@app.route('/quotes', methods=['GET', 'POST'])
def quotes():
    """Quotes management page - view and manage pending quotes"""
    if not session.get('is_admin'):
        flash('Please login as admin to access this page')
        return redirect(url_for('admin_login'))

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get all quotes with status filter
        status_filter = request.args.get('status', 'pending')

        cursor.execute("""
            SELECT quote_id, customer_name, book_title, book_price, total_jpy,
                   status, created_at, updated_at
            FROM quotes
            WHERE status = %s
            ORDER BY created_at DESC
        """, (status_filter,))

        quotes_raw = cursor.fetchall()
        quotes = []

        for row in quotes_raw:
            quotes.append({
                'quote_id': row[0],
                'customer_name': row[1],
                'book_title': row[2],
                'book_price': safe_decimal_to_float(row[3]),
                'total_jpy': row[4],
                'status': row[5],
                'created_at': row[6],
                'updated_at': row[7]
            })

        return render_template('quotes.html', quotes=quotes, status_filter=status_filter)

    except Exception as e:
        flash(f'Error loading quotes: {e}')
        return redirect(url_for('dashboard'))
    finally:
        if conn:
            conn.close()



@app.route('/customer-account/<customer_name>')
def customer_account(customer_name):
    """Customer account page - shows financial transactions and balance"""
    if not session.get('is_admin'):
        flash('Please login as admin to access this page')
        return redirect(url_for('admin_login'))

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get customer information
        cursor.execute("SELECT customer_id, customer_name, customer_address, customer_telephone FROM customers WHERE customer_name = %s", (customer_name,))
        customer = cursor.fetchone()

        if not customer:
            flash(f'Customer "{customer_name}" not found')
            return redirect(url_for('customers'))

        customer_id = customer[0]
        customer_info = {
            'customer_id': customer[0],
            'customer_name': customer[1],
            'customer_address': customer[2] or '',
            'customer_telephone': customer[3] or ''
        }

        # Get all transactions for this customer
        cursor.execute("""
            SELECT account_id, transaction_type, amount, description, order_id,
                   transaction_date, created_at
            FROM customer_accounts
            WHERE customer_id = %s
            ORDER BY transaction_date DESC, created_at DESC
        """, (customer_id,))

        transactions_raw = cursor.fetchall()
        transactions = []

        for row in transactions_raw:
            transactions.append({
                'account_id': row[0],
                'transaction_type': row[1],
                'amount': safe_decimal_to_float(row[2]),
                'description': row[3] or '',
                'order_id': row[4],
                'transaction_date': row[5],
                'created_at': row[6]
            })

        # Calculate balances
        total_debits = sum(t['amount'] for t in transactions if t['transaction_type'] == 'debit')
        total_payments = sum(t['amount'] for t in transactions if t['transaction_type'] == 'payment')
        total_credits = sum(t['amount'] for t in transactions if t['transaction_type'] == 'credit')

        current_balance = total_debits - total_payments - total_credits

        # Get orders summary for this customer
        cursor.execute("""
            SELECT COUNT(*) as total_orders, COALESCE(SUM(total_value), 0) as total_orders_value
            FROM orders
            WHERE customer_name = %s
        """, (customer_name,))

        orders_summary = cursor.fetchone()

        account_summary = {
            'total_debt': total_debits,
            'total_payments': total_payments,
            'total_credits': total_credits,
            'current_balance': current_balance,
            'total_orders': orders_summary[0],
            'total_orders_value': safe_decimal_to_float(orders_summary[1])
        }

        return render_template('customer_account.html',
                             customer=customer_info,
                             transactions=transactions,
                             account_summary=account_summary)

    except Exception as e:
        flash(f'Error loading customer account: {e}')
        return redirect(url_for('customers'))
    finally:
        if conn:
            conn.close()

@app.route('/customer-account/<customer_name>/add-transaction', methods=['POST'])
def add_customer_transaction(customer_name):
    """Add a new transaction to customer account"""
    if not session.get('is_admin'):
        return jsonify({'success': False, 'error': 'Authentication required'}), 401

    try:
        data = request.get_json() if request.is_json else request.form

        transaction_type = data.get('transaction_type')
        amount = float(data.get('amount', 0))
        description = data.get('description', '')
        transaction_date = data.get('transaction_date')

        if not transaction_type or amount <= 0:
            return jsonify({'success': False, 'error': 'Transaction type and valid amount are required'})

        conn = get_db_connection()
        cursor = conn.cursor()

        # Get customer ID
        cursor.execute("SELECT customer_id FROM customers WHERE customer_name = %s", (customer_name,))
        customer = cursor.fetchone()

        if not customer:
            return jsonify({'success': False, 'error': 'Customer not found'})

        customer_id = customer[0]

        # Insert transaction
        cursor.execute("""
            INSERT INTO customer_accounts (customer_id, customer_name, transaction_type, amount,
                                         description, transaction_date, admin_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (customer_id, customer_name, transaction_type, amount, description,
              transaction_date, session.get('admin_id')))

        conn.commit()

        if request.is_json:
            return jsonify({'success': True, 'message': 'Transaction added successfully'})
        else:
            flash('Transaction added successfully!')
            return redirect(url_for('customer_account', customer_name=customer_name))

    except ValueError:
        error_msg = 'Invalid amount provided'
        if request.is_json:
            return jsonify({'success': False, 'error': error_msg})
        else:
            flash(error_msg)
            return redirect(url_for('customer_account', customer_name=customer_name))
    except Exception as e:
        error_msg = f'Error adding transaction: {e}'
        if request.is_json:
            return jsonify({'success': False, 'error': error_msg})
        else:
            flash(error_msg)
            return redirect(url_for('customer_account', customer_name=customer_name))
    finally:
        if conn:
            conn.close()

@app.route('/customer-account/<customer_name>/delete-transaction/<int:account_id>', methods=['DELETE', 'POST'])
def delete_customer_transaction(customer_name, account_id):
    """Delete a customer transaction"""
    if not session.get('is_admin'):
        return jsonify({'success': False, 'error': 'Authentication required'}), 401

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Verify transaction belongs to customer
        cursor.execute("""
            SELECT account_id FROM customer_accounts
            WHERE account_id = %s AND customer_name = %s
        """, (account_id, customer_name))

        if not cursor.fetchone():
            return jsonify({'success': False, 'error': 'Transaction not found'})

        # Delete transaction
        cursor.execute("DELETE FROM customer_accounts WHERE account_id = %s", (account_id,))
        conn.commit()

        if request.method == 'DELETE':
            return jsonify({'success': True, 'message': 'Transaction deleted successfully'})
        else:
            flash('Transaction deleted successfully!')
            return redirect(url_for('customer_account', customer_name=customer_name))

    except Exception as e:
        error_msg = f'Error deleting transaction: {e}'
        if request.method == 'DELETE':
            return jsonify({'success': False, 'error': error_msg})
        else:
            flash(error_msg)
            return redirect(url_for('customer_account', customer_name=customer_name))
    finally:
        if conn:
            conn.close()

# Add this API endpoint for automatic transaction creation when orders are created
@app.route('/api/create-order-transaction', methods=['POST'])
def api_create_order_transaction():
    """Create automatic debit transaction when order is created"""
    if not session.get('is_admin'):
        return jsonify({'success': False, 'error': 'Authentication required'}), 401

    try:
        data = request.get_json()
        customer_name = data.get('customer_name')
        order_id = data.get('order_id')
        amount = float(data.get('amount', 0))
        description = data.get('description', f'Order #{order_id} - Books purchase')

        conn = get_db_connection()
        cursor = conn.cursor()

        # Get customer ID
        cursor.execute("SELECT customer_id FROM customers WHERE customer_name = %s", (customer_name,))
        customer = cursor.fetchone()

        if not customer:
            return jsonify({'success': False, 'error': 'Customer not found'})

        customer_id = customer[0]

        # Insert debit transaction
        cursor.execute("""
            INSERT INTO customer_accounts (customer_id, customer_name, transaction_type, amount,
                                         description, order_id, transaction_date, admin_id)
            VALUES (%s, %s, 'debit', %s, %s, %s, %s, %s)
        """, (customer_id, customer_name, amount, description, order_id,
              datetime.now().date(), session.get('admin_id')))

        conn.commit()

        return jsonify({'success': True, 'message': 'Order transaction created successfully'})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
    finally:
        if conn:
            conn.close()

@app.route('/print-customer-label', methods=['POST'])
def print_customer_label():
    """Print customer address label"""
    if not session.get('is_admin'):
        flash('Please login as admin to access this feature')
        return redirect(url_for('admin_login'))

    try:
        # Get customer data from form
        customer_data = {
            'id': request.form.get('id'),
            'name': request.form.get('name'),
            'address': request.form.get('address'),
            'telephone': request.form.get('telephone')
        }

        return render_template('print_label.html', customer=customer_data)

    except Exception as e:
        flash(f'Error preparing label: {e}')
        return redirect(url_for('customers'))


@app.route('/orders/batch-edit', methods=['POST'])
def batch_edit_orders():
    """Batch edit multiple orders - update delivery date and payment type"""
    if not session.get('is_admin'):
        flash('Please login as admin to access this page')
        return redirect(url_for('admin_login'))

    # ADD THIS DEBUG LINE
    print(f"DEBUG: Form data: {request.form}")
    print(f"DEBUG: Args: {request.args}")

    try:
        order_ids = request.form.get('order_ids', '').split(',')
        delivery_date = request.form.get('delivery_date') or None
        payment_type = request.form.get('payment_type') or None
        return_to = request.args.get('return', 'orders')

        if not order_ids or order_ids == ['']:
            flash('No orders selected for batch edit')
            return redirect(url_for('orders'))

        # Filter out empty order IDs
        order_ids = [id.strip() for id in order_ids if id.strip()]

        if not order_ids:
            flash('No valid order IDs provided')
            return redirect(url_for('orders'))

        conn = get_db_connection()
        cursor = conn.cursor()

        # Build update query
        update_fields = []
        update_values = []

        if delivery_date:
            update_fields.append("delivery_date = %s")
            update_values.append(delivery_date)

        if payment_type:
            update_fields.append("payment_type = %s")
            update_values.append(payment_type)

        if not update_fields:
            flash('No fields selected for update')
            return redirect(url_for('orders'))

        # Add updated_at timestamp
        update_fields.append("updated_at = CURRENT_TIMESTAMP")

        # Add order IDs to values for WHERE clause
        placeholders = ','.join(['%s'] * len(order_ids))
        update_values.extend(order_ids)

        # Execute batch update
        query = f"""
            UPDATE orders
            SET {', '.join(update_fields)}
            WHERE order_id IN ({placeholders})
        """

        cursor.execute(query, update_values)
        conn.commit()

        updated_count = cursor.rowcount
        flash(f'Successfully updated {updated_count} orders!')

    except Exception as e:
        flash(f'Error updating orders: {e}')
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

    if return_to == 'dashboard':
        return redirect(url_for('dashboard'))
    else:
        return redirect(url_for('orders'))


@app.route('/orders/batch-delete', methods=['POST'])
def batch_delete_orders():
    """Batch delete multiple orders"""
    if not session.get('is_admin'):
        flash('Please login as admin to access this page')
        return redirect(url_for('admin_login'))

    print(f"DEBUG: Form data: {request.form}")
    print(f"DEBUG: Args: {request.args}")

    conn = None  # Initialize conn to avoid UnboundLocalError
    try:
        order_ids = request.form.get('order_ids', '').split(',')
        return_to = request.args.get('return', 'orders')

        if not order_ids or order_ids == ['']:
            flash('No orders selected for batch delete')
            return redirect(url_for('orders'))

        # Filter out empty order IDs
        order_ids = [id.strip() for id in order_ids if id.strip()]

        if not order_ids:
            flash('No valid order IDs provided')
            return redirect(url_for('orders'))

        conn = get_db_connection()
        cursor = conn.cursor()

        # Execute batch delete
        placeholders = ','.join(['%s'] * len(order_ids))
        query = f"""
            DELETE FROM orders
            WHERE order_id IN ({placeholders})
        """

        cursor.execute(query, order_ids)
        conn.commit()

        deleted_count = cursor.rowcount
        flash(f'Successfully deleted {deleted_count} orders!')

    except Exception as e:
        flash(f'Error deleting orders: {e}')
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

    if return_to == 'dashboard':
        return redirect(url_for('dashboard'))
    else:
        return redirect(url_for('orders'))


# Uncomment the line below to create the calculations table (run once)
# create_calculations_table()

# Keep old routes for backward compatibility
@app.route('/admin-login', methods=['GET', 'POST'])
def admin_login_old():
    return admin_login()

@app.route('/admin-logout')
def admin_logout_old():
    return admin_logout()

# For development
if __name__ == '__main__':
    app.run(debug=True)