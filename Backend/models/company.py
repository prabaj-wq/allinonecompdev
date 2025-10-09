from sqlalchemy import Column, Integer, String, Enum, DateTime, func
from sqlalchemy.orm import relationship
from .base import Base
from enum import Enum as PyEnum

class EnvironmentType(str, PyEnum):
    PRODUCTION = "production"
    DEVELOPMENT = "development"

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    environment_type = Column(Enum(EnvironmentType), nullable=False)
    industry = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Company(id={self.id}, name='{self.name}', environment='{self.environment_type}')>"