"""
Initialize the database: create all tables and seed the admin user.
Run this once before starting the application:
    python init_db.py
"""
from app.database import engine, SessionLocal, Base
from app.models import User, Product, Order, OrderItem, CartItem, ChatSession, ChatMessage, UnansweredQuestion
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def init_database():
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

    db = SessionLocal()
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if existing_admin:
            print("Admin user already exists, skipping seed.")
            return

        # Create admin user
        admin = User(
            username="admin",
            password_hash=pwd_context.hash("admin123"),
            email="admin@yali-phone.com",
            is_admin=True,
        )
        db.add(admin)
        db.commit()
        print("Admin user created: username='admin', password='admin123'")
        print("Note: products table is empty. Add products via the admin dashboard.")
    finally:
        db.close()


if __name__ == "__main__":
    init_database()
    print("Database initialization complete!")

