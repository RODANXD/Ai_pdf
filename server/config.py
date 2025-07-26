import os
from datetime import timedelta

class Config:
    SECRET_KEY = "flask-secret-key"
    JWT_SECRET_KEY = "jwt-secret-key"
    SQLALCHEMY_DATABASE_URI ='mysql+pymysql://root:1111@localhost:3306/research_db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=120)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=1)