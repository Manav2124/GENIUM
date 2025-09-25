from datetime import datetime
from pymongo import MongoClient
from bson.objectid import ObjectId

class User:
    def __init__(self, name, email, image, provider_id, _id=None, created_at=None, updated_at=None):
        self.name = name
        self.email = email
        self.image = image
        self.provider_id = provider_id
        self._id = _id if _id else ObjectId()
        self.created_at = created_at if created_at else datetime.utcnow()
        self.updated_at = updated_at if updated_at else datetime.utcnow()

    def to_dict(self):
        return {
            "_id": str(self._id),
            "name": self.name,
            "email": self.email,
            "image": self.image,
            "provider_id": self.provider_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

    @staticmethod
    def from_dict(data):
        return User(
            name=data.get("name"),
            email=data.get("email"),
            image=data.get("image"),
            provider_id=data.get("provider_id"),
            _id=ObjectId(data["_id"]) if "_id" in data else None,
            created_at=datetime.fromisoformat(data["created_at"]) if "created_at" in data else None,
            updated_at=datetime.fromisoformat(data["updated_at"]) if "updated_at" in data else None
        )

class UserRepository:
    def __init__(self, mongo_db):
        self.collection = mongo_db.users

    def create_user(self, user):
        print(f"UserRepository: Attempting to create user with email: {user.email}")
        user.created_at = datetime.utcnow()
        user.updated_at = datetime.utcnow()
        try:
            result = self.collection.insert_one(user.to_dict())
            user._id = result.inserted_id
            print(f"UserRepository: Successfully created user with ID: {user._id}")
            return user
        except Exception as e:
            print(f"UserRepository: Error creating user {user.email}: {str(e)}")
            import traceback
            print(f"UserRepository: Full traceback for create_user error: {traceback.format_exc()}")
            raise # Re-raise the exception to be caught by calling function

    def get_user_by_email(self, email):
        user_data = self.collection.find_one({"email": email})
        if user_data:
            return User.from_dict(user_data)
        return None

    def get_user_by_provider_id(self, provider_id):
        user_data = self.collection.find_one({"provider_id": provider_id})
        if user_data:
            return User.from_dict(user_data)
        return None

    def update_user(self, user):
        print(f"UserRepository: Attempting to update user with ID: {user._id}, email: {user.email}")
        user.updated_at = datetime.utcnow()
        try:
            result = self.collection.update_one(
                {"_id": user._id},
                {"$set": user.to_dict()}
            )
            print(f"UserRepository: User update result - Matched: {result.matched_count}, Modified: {result.modified_count}")
            return user
        except Exception as e:
            print(f"UserRepository: Error updating user {user.email} (ID: {user._id}): {str(e)}")
            import traceback
            print(f"UserRepository: Full traceback for update_user error: {traceback.format_exc()}")
            raise # Re-raise the exception to be caught by calling function

    def find_or_create_oauth_user(self, profile_data):
        """
        Finds a user by email or provider_id. If not found, creates a new user.
        profile_data should contain: email, name, image (profile picture), provider_id
        """
        print(f"UserRepository: find_or_create_oauth_user called with profile_data: {profile_data}")
        email = profile_data.get("email")
        provider_id = profile_data.get("provider_id")
        name = profile_data.get("name")
        image = profile_data.get("image")

        user = None
        if email:
            user = self.get_user_by_email(email)
            if user:
                print(f"UserRepository: User found by email: {user.email}")
        
        if not user and provider_id:
            user = self.get_user_by_provider_id(provider_id)
            if user:
                print(f"UserRepository: User found by provider_id: {user.provider_id}")

        if user:
            print(f"UserRepository: Updating existing user: {user.email}")
            # Update existing user's profile data if necessary
            user.name = name
            user.image = image
            user.provider_id = provider_id # Ensure provider_id is set if user was found by email
            self.update_user(user)
            print(f"UserRepository: User updated: {user.email}")
            return user
        else:
            print(f"UserRepository: Creating new user with email: {email}, provider_id: {provider_id}")
            # Create new user
            new_user = User(
                name=name,
                email=email,
                image=image,
                provider_id=provider_id
            )
            created_user = self.create_user(new_user)
            print(f"UserRepository: New user created with ID: {created_user._id}")
            return created_user
