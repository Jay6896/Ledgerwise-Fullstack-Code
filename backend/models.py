from extensions import db
from flask_login import UserMixin

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(30), nullable=False, unique=True)
    email = db.Column(db.String(150), nullable=False, unique=True)
    password = db.Column(db.String(256), nullable=False)

class BusinessProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, unique=True)
    name = db.Column(db.String(80), nullable=False)
    industry = db.Column(db.String(100))
    business_type = db.Column(db.String(100))

    user = db.relationship('User', backref=db.backref('business_profile', uselist=False))

class Sale(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    amount = db.Column(db.Float, nullable=False)  # total amount (quantity * unit_price)
    date = db.Column(db.Date)
    description = db.Column(db.String(255))
    quantity = db.Column(db.Integer, default=1)
    unit_price = db.Column(db.Float)
    business_id = db.Column(db.Integer, db.ForeignKey('business_profile.id'))  # <== should match the actual table name

    business = db.relationship('BusinessProfile', backref=db.backref('sales', lazy=True))


class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float)  # total amount (quantity * unit_price)
    date = db.Column(db.Date)
    description = db.Column(db.String(255))
    quantity = db.Column(db.Integer, default=1)
    unit_price = db.Column(db.Float)
    business_id = db.Column(db.Integer, db.ForeignKey('business_profile.id'))

    business = db.relationship('BusinessProfile', backref=db.backref('expenses', lazy=True))
