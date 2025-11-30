# full_backup.py
import subprocess
import datetime
import os
import tarfile
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class BackupManager:
    def __init__(self):
        self.timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        self.backup_dir = "/home/clubinhobusca/backups/"
        self.website_dir = "/home/clubinhobusca/mysite/"
        

        self.db_user = "clubinhobusca"
        self.db_password = "Clubinho1234"
        self.db_host = "clubinhobusca.mysql.pythonanywhere-services.com"
        self.db_name = "clubinhobusca$clubinho_db05"
        
        # Email configuration (optional)
        self.email_enabled = True
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.email_user = "salomaowk@gmail.com"
        self.email_password = "zkbj xdjv vrxj vpwl"
        self.notification_email = "salomaowk@gmail.com"
        
    def create_backup_directory(self):
        if not os.path.exists(self.backup_dir):
            os.makedirs(self.backup_dir)
            print(f"Created backup directory: {self.backup_dir}")
    
    def backup_database(self):
        print("Starting database backup...")
        backup_file = f"{self.backup_dir}db_backup_{self.timestamp}.sql"
        
        cmd = [
            "mysqldump",
            "-u", self.db_user,
            f"-p{self.db_password}",
            f"--host={self.db_host}",
            self.db_name
        ]
        
        try:
            with open(backup_file, 'w') as f:
                result = subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, check=True)
            
            file_size = os.path.getsize(backup_file)
            print(f"Database backup completed: {backup_file} ({file_size} bytes)")
            return backup_file
            
        except subprocess.CalledProcessError as e:
            print(f"Database backup failed: {e.stderr.decode()}")
            raise
    
    def backup_website_files(self):
        print("Starting website files backup...")
        backup_file = f"{self.backup_dir}website_backup_{self.timestamp}.tar.gz"
        
        try:
            with tarfile.open(backup_file, "w:gz") as tar:
                tar.add(self.website_dir, arcname="website")
            
            file_size = os.path.getsize(backup_file)
            print(f"Website backup completed: {backup_file} ({file_size} bytes)")
            return backup_file
            
        except Exception as e:
            print(f"Website backup failed: {str(e)}")
            raise
    
    def cleanup_old_backups(self, days_to_keep=7):
        """Remove backups older than specified days"""
        print(f"Cleaning up backups older than {days_to_keep} days...")
        cutoff_time = datetime.datetime.now() - datetime.timedelta(days=days_to_keep)
        removed_count = 0
        
        for filename in os.listdir(self.backup_dir):
            filepath = os.path.join(self.backup_dir, filename)
            if os.path.isfile(filepath) and os.path.getctime(filepath) < cutoff_time.timestamp():
                os.remove(filepath)
                print(f"Removed old backup: {filename}")
                removed_count += 1
        
        print(f"Cleanup completed. Removed {removed_count} old backup(s)")
    
    def send_notification(self, success, message):
        """Send email notification about backup status"""
        if not self.email_enabled:
            return
            
        try:
            subject = f"Backup {'Success' if success else 'Failed'} - {datetime.datetime.now().strftime('%Y-%m-%d')}"
            
            msg = MIMEMultipart()
            msg['From'] = self.email_user
            msg['To'] = self.notification_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(message, 'plain'))
            
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.email_user, self.email_password)
            server.send_message(msg)
            server.quit()
            
            print("Email notification sent successfully")
            
        except Exception as e:
            print(f"Failed to send email notification: {str(e)}")
    
    def get_backup_summary(self):
        """Get summary of existing backups"""
        if not os.path.exists(self.backup_dir):
            return "No backup directory found"
        
        files = [f for f in os.listdir(self.backup_dir) if os.path.isfile(os.path.join(self.backup_dir, f))]
        db_backups = [f for f in files if f.startswith('db_backup_')]
        web_backups = [f for f in files if f.startswith('website_backup_')]
        
        return f"Total backups: {len(files)} (DB: {len(db_backups)}, Website: {len(web_backups)})"
    
    def run_full_backup(self):
        start_time = datetime.datetime.now()
        print(f"=== Starting Full Backup - {start_time.strftime('%Y-%m-%d %H:%M:%S')} ===")
        
        try:
            # Create backup directory
            self.create_backup_directory()
            
            # Backup database
            db_backup = self.backup_database()
            
            # Backup website files
            web_backup = self.backup_website_files()
            
            # Cleanup old backups
            self.cleanup_old_backups()
            
            # Get summary
            summary = self.get_backup_summary()
            
            end_time = datetime.datetime.now()
            duration = end_time - start_time
            
            success_message = f"""
Backup completed successfully!

Duration: {duration}
Database backup: {os.path.basename(db_backup)}
Website backup: {os.path.basename(web_backup)}
{summary}

Backup location: {self.backup_dir}
            """
            
            print("=== Backup Completed Successfully ===")
            print(success_message)
            
            # Send success notification
            self.send_notification(True, success_message.strip())
            
        except Exception as e:
            error_message = f"Backup failed: {str(e)}"
            print(f"=== Backup Failed ===")
            print(error_message)
            
            # Send failure notification
            self.send_notification(False, error_message)
            raise

if __name__ == "__main__":
    backup_manager = BackupManager()
    backup_manager.run_full_backup()
