# ErrorHub API - Translation Endpoints

This document describes the available endpoints for managing error translations in ErrorHub.

## Architecture

ErrorHub's API follows a clean architecture approach with the following layers:
- **Routes**: Handle HTTP requests and responses
- **Services**: Contain business logic
- **Repositories**: Handle data access and persistence

All translation endpoints now use the TranslationService instead of directly accessing repositories, providing better separation of concerns and maintainability.

## Endpoints

### Create/Update Translation (Upsert)

Creates a new translation if it doesn't exist, or updates an existing one.

- **URL**: `/api/translations`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "errorCode": "USER.NOT_FOUND",
    "language": "ru",
    "message": "Пользователь не найден"
  }
  ```
- **Success Response**:
  - **Code**: 200 (OK)
  - **Content**:
    ```json
    {
      "id": 1,
      "errorCode": "USER.NOT_FOUND",
      "language": "ru",
      "message": "Пользователь не найден",
      "createdAt": "2023-06-01T12:00:00Z",
      "updatedAt": "2023-06-01T12:00:00Z"
    }
    ```
- **Error Responses**:
  - **Code**: 404 (Not Found) - Error code doesn't exist
  - **Code**: 400 (Bad Request) - Validation error

### Get Translations by Error Code

Retrieves all translations for a specific error code.

- **URL**: `/api/translations/error/:code`
- **Method**: `GET`
- **URL Parameters**: `code` - The error code
- **Success Response**:
  - **Code**: 200 (OK)
  - **Content**:
    ```json
    [
      {
        "id": 1,
        "errorCode": "USER.NOT_FOUND",
        "language": "ru",
        "message": "Пользователь не найден",
        "createdAt": "2023-06-01T12:00:00Z",
        "updatedAt": "2023-06-01T12:00:00Z"
      },
      {
        "id": 2,
        "errorCode": "USER.NOT_FOUND",
        "language": "fr",
        "message": "Utilisateur non trouvé",
        "createdAt": "2023-06-01T12:00:00Z",
        "updatedAt": "2023-06-01T12:00:00Z"
      }
    ]
    ```

### Get Translations by Language

Retrieves all translations for a specific language.

- **URL**: `/api/translations/language/:lang`
- **Method**: `GET`
- **URL Parameters**: `lang` - The language code
- **Success Response**:
  - **Code**: 200 (OK)
  - **Content**: Array of translations

### Delete Translation

Deletes a translation.

- **URL**: `/api/translations/:id`
- **Method**: `DELETE`
- **URL Parameters**: `id` - The translation ID
- **Success Response**:
  - **Code**: 204 (No Content)
- **Error Responses**:
  - **Code**: 404 (Not Found) - Translation doesn't exist

## Example Usage

```javascript
// Create or update a translation
const response = await fetch('http://localhost:3000/api/translations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    errorCode: 'USER.NOT_FOUND',
    language: 'ru',
    message: 'Пользователь не найден'
  }),
});

const data = await response.json();
console.log(data);
``` 