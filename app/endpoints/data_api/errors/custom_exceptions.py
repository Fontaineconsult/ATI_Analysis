# Custom Exceptions

class DatabaseError(Exception):
    """Base class for errors raised during database operations."""
    def __init__(self, message, original_exception=None):
        super().__init__(message)
        self.original_exception = original_exception

class NotFoundError(DatabaseError):
    """Raised when a requested resource is not found in the database."""
    pass

class ValidationError(DatabaseError):
    """Raised when invalid data is provided for a database operation."""
    pass

class CrudError(Exception):
    """Raised in the CRUD layer when database operations fail."""
    def __init__(self, message, original_exception=None):
        super().__init__(message)
        self.original_exception = original_exception

class ApiError(Exception):
    """Raised in the API layer when handling requests."""
    def __init__(self, message, original_exception=None):
        super().__init__(message)
        self.original_exception = original_exception
