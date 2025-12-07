# Clubinho Website - Book Import & Sales Management System

A Flask-based web application for managing book inventory, customer orders, and financial transactions. Built specifically for importing books from Brazil (BRL) and selling them in Japan (JPY).

## Features

### 📚 Core Features
- **Customer Management**: CRUD operations for customer information and delivery preferences
- **Book Catalog**: Inventory management with multi-currency pricing (BRL, JPY, Black Market, Private)
- **Order Management**: Create, edit, and track orders with integrated calculator
- **Quote System**: Generate quotes before finalizing orders with approval workflow
- **Financial Tracking**: Customer account transactions with debit/payment/credit tracking
- **Exchange Rate Integration**: Real-time BRL to JPY conversion via ExchangeRate-API

### 📊 Reporting & Analytics
- Dashboard with key metrics (total customers, orders, revenue, pending quotes)
- Monthly sales reports with trends
- Top customers and best-selling books analytics
- Order status tracking (Pending → Processing → Delivered)
- Customer financial balance summary

### 🔐 Security
- Admin authentication with session management
- Password hashing support (pbkdf2)
- CORS headers for API calls
- Role-based access control

## Technology Stack

- **Backend**: Flask (Python)
- **Database**: MySQL 5.7+
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Exchange Rate**: ExchangeRate-API (Free tier)
- **ORM**: MySQL Connector Python

## Project Structure

```
website/
├── app.py                          # Main Flask application (2500+ lines)
├── templates/                      # HTML templates
│   ├── base.html                   # Base layout template
│   ├── admin_login.html            # Login page
│   ├── dashboard.html              # Main dashboard
│   ├── customers.html              # Customer management
│   ├── books.html                  # Book inventory
│   ├── orders.html                 # Order management
│   ├── quotes.html                 # Quote management
│   ├── reports.html                # Analytics & reports
│   ├── create_order.html           # Order creation with calculator
│   ├── customer_account.html       # Customer financial transactions
│   ├── print_label.html            # Address label printing
│   └── partials/                   # Reusable template components
├── static/
│   ├── css/
│   │   ├── style.css               # Main stylesheet
│   │   ├── themes.css              # Theme support
│   │   ├── animations.css          # Animations
│   │   ├── accessibility.css       # Accessibility features
│   │   ├── floating-tools.css      # Floating toolbar
│   │   ├── page-enhancements.css   # Page-specific styles
│   │   └── parallax.css            # Parallax effects
│   └── js/
│       ├── navbar.js               # Navigation functionality
│       ├── calculator.js           # Book import calculator
│       ├── orders.js               # Order management scripts
│       ├── quotes.js               # Quote management scripts
│       ├── theme-toggle.js         # Dark mode toggle
│       ├── interactions.js         # UI interactions
│       └── floating-tools.js       # Floating toolbar
├── .env                            # Environment variables (not in repo)
└── MEDIUM_PRIORITY_ENHANCEMENTS.md # Future improvements
```

## Installation

### Prerequisites
- Python 3.8+
- MySQL 5.7+ with running server
- pip (Python package manager)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Salomaowk/clubinho_new_style_20251130.git
   cd website
   ```

2. **Create virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # macOS/Linux
   # or
   venv\Scripts\activate  # Windows
   ```

3. **Install dependencies**
   ```bash
   pip install flask mysql-connector-python python-dotenv requests
   ```

4. **Configure environment variables**
   ```bash
   # Create .env file in the website directory
   cat > .env << EOF
   DB_HOST=127.0.0.1
   DB_USER=root
   DB_PASS=your_password
   DB_NAME=clubinho
   APP_SECRET_KEY=your_secret_key_here
   EOF
   ```

5. **Setup database**
   - Create MySQL database: `CREATE DATABASE clubinho;`
   - Import schema (if provided)
   - Create admin user in `login` table

6. **Run the application**
   ```bash
   python app.py
   ```

   The app will be available at `http://localhost:5000`

## Database Schema

### Core Tables
- **login**: Admin authentication credentials
- **customers**: Customer information and delivery preferences
- **assets**: Book inventory with multi-currency pricing
- **orders**: Order records linking customers to books
- **quotes**: Quote management for approval workflow
- **customer_accounts**: Financial transaction tracking
- **calculations**: Historical price calculations (optional)

### Key Features
- Multi-currency pricing: BRL, JPY, Black Market, Private rates
- Support for legacy NULL dates (0000-00-00) for backward compatibility
- Audit timestamps (created_at, updated_at)
- Foreign key relationships for data integrity

## API Endpoints

### Authentication
- `POST /admin/login` - Admin login
- `GET /admin/logout` - Admin logout

### Page Routes
- `GET /dashboard` - Main dashboard with metrics
- `GET /customers` - Customer list and management
- `GET /orders` - Order list with filtering and pagination
- `GET /books` - Book inventory management
- `GET /quotes` - Quote management and approval
- `GET /reports` - Analytics and reporting
- `GET /create_order` - Order creation with calculator
- `GET /customer-account/<name>` - Customer financial transactions

### API Endpoints
- `POST /api/calculate` - Calculate book prices with margin
- `GET /api/exchange-rate` - Get current BRL to JPY rate
- `POST /api/save-quote` - Save calculation as quote
- `POST /api/quotes/<id>/approve` - Approve quote and create order
- `DELETE /api/quotes/<id>/reject` - Reject quote
- `GET /api/customers` - Get customers list (JSON)
- `GET /api/assets` - Get assets with prices (JSON)
- `GET /api/orders` - Get orders with pagination (JSON)
- `POST /api/create-customer` - Create customer from API
- `POST /api/create-asset` - Create asset from API

## Key Features in Detail

### 💰 Calculator System
- **Input**: Book price (BRL), Shipping cost, Profit margin percentage
- **Output**: Final price in JPY with exchange rate details
- **Exchange Rate**: Real-time from ExchangeRate-API with fallback to 30.0
- **Adjustments**: Per-market shipping adjustments (JPY)

### 📋 Quote Workflow
1. **Create**: Generate quote from calculator
2. **Review**: View all pending quotes
3. **Approve**: Convert quote to order automatically
4. **Reject**: Mark quote as rejected
5. **Track**: Monitor order delivery

### 💳 Customer Financial Management
- **Transaction Types**: Debit (purchase), Payment, Credit (refund/discount)
- **Balance Calculation**: Automatic tracking of customer balance
- **History**: Complete transaction audit trail with descriptions
- **Order Linking**: Associate transactions with specific orders

### 🌍 Multi-Currency Support
- **BRL** (Brazilian Real): Book import prices and Brazil shipping
- **JPY** (Japanese Yen): Final customer pricing in Japan
- **Black Market**: Alternative pricing for specific customers
- **Private**: Premium/private pricing channel

## Configuration

### Environment Variables (.env)
```
DB_HOST=127.0.0.1         # MySQL server hostname
DB_USER=root              # MySQL username
DB_PASS=secret            # MySQL password
DB_NAME=clubinho          # Database name
APP_SECRET_KEY=dev-secret # Flask session secret key
```

### Application Settings
- Default profit margin: 30%
- Exchange rate source: ExchangeRate-API (exchangerate-api.com)
- Fallback exchange rate: 30.0 BRL/JPY
- Session timeout: Browser default (not explicitly set)

## Usage Examples

### 1. Add a New Customer
```
1. Go to Customers page
2. Click "Add Customer" button
3. Enter: Name, Address, Telephone, Delivery Time Request
4. Click "Add"
```

### 2. Create and Approve Quote
```
1. Go to Create Order
2. Enter book price, shipping cost, profit margin
3. Click "Save as Quote"
4. Go to Quotes page
5. Review pending quote
6. Click "Approve" to convert to order
```

### 3. Track Customer Balance
```
1. Go to Customers
2. Click on customer name
3. View transaction history
4. Add new transaction (payment, credit, debit)
5. See updated balance
```

### 4. Generate Sales Report
```
1. Go to Reports
2. View key metrics: Total Revenue, Orders, Customers
3. Check monthly sales trends
4. View top customers and books
5. Filter by order status
```

## Troubleshooting

### Database Connection Error
```bash
# Verify MySQL is running
mysql -u root -p -e "SELECT 1"

# Check credentials in .env match your MySQL setup
# Ensure database exists: CREATE DATABASE IF NOT EXISTS clubinho;
```

### Exchange Rate API Unavailable
- Application falls back to 30.0 BRL/JPY exchange rate
- Users are notified of fallback rate in UI
- No orders are blocked due to API unavailability

### Login Issues
- Clear browser cookies/cache
- Verify `APP_SECRET_KEY` is set in .env
- Check admin user exists in `login` table with correct password
- Try resetting password if needed

### Order Calculation Errors
- Ensure numeric inputs are valid (no negative numbers)
- Verify database connection is active
- Check exchange rate is loading correctly
- Review browser console for JavaScript errors

## Development

### Code Organization
- **app.py**: All Flask routes, database logic, API endpoints
- **templates/**: Jinja2 templates for HTML rendering
- **static/css/**: Modular CSS (separate concerns)
- **static/js/**: Vanilla JavaScript (no dependencies)

### Adding New Features
1. Create feature branch: `git checkout -b feature/name`
2. Modify database schema if needed
3. Add Flask routes in app.py
4. Create templates in templates/
5. Add static assets (CSS/JS)
6. Test thoroughly
7. Commit with clear messages
8. Push and create pull request

### Code Standards
- Use meaningful variable names
- Add docstrings to functions
- Keep templates DRY (use partials)
- Comment complex logic
- Handle errors gracefully

## Future Enhancements

See `MEDIUM_PRIORITY_ENHANCEMENTS.md` for detailed roadmap:
- Email notifications for order updates
- Advanced reporting with CSV export
- Bulk order import functionality
- Payment gateway integration
- Mobile-responsive dashboard improvements
- Inventory alerts and low-stock warnings
- Customer communication templates
- API rate limiting and caching

## Performance Considerations

### Database
- Indexes on frequently queried columns (customer_name, order_date)
- Pagination (20 items per page) to limit result sets
- Connection pooling via MySQL connector

### Frontend
- Minimal CSS/JS files
- No heavy frameworks (Vanilla JavaScript)
- Caching via browser defaults

## Security Notes

⚠️ **Important for Production**:
1. Change `APP_SECRET_KEY` to a strong random value
2. Update database passwords
3. Enable HTTPS (use reverse proxy)
4. Implement rate limiting
5. Add CSRF protection
6. Use environment variables for secrets
7. Regularly backup database
8. Log all admin actions

## License

Proprietary - All rights reserved

## Author

Salomão A. Kawakami

## Repository

https://github.com/Salomaowk/clubinho_new_style_20251130

## Support

For issues or questions:
1. Check existing issues on GitHub
2. Review enhancements document
3. Contact development team

---

**Version**: 1.0.0 | **Updated**: November 2025 | **Status**: Active Development
