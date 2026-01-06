# SwipeTodo PocketBase Backend

This directory contains the PocketBase backend for SwipeTodo.

## Requirements

- PocketBase v0.25.1 (included)
- macOS (binary is for darwin-amd64/arm64)

## Quick Start

### 1. Start PocketBase

```bash
./start.sh
```

This starts PocketBase on `http://127.0.0.1:8090`.

### 2. Create a Superuser (First Time Only)

```bash
./pocketbase superuser create admin@swipetodo.local yourpassword123
```

### 3. Set Up the Schema

Either run the setup script:

```bash
./setup_schema.sh admin@swipetodo.local yourpassword123
```

Or manually create the collections via the Admin UI at `http://127.0.0.1:8090/_/`.

## Database Schema

### Collections

#### 1. `households`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | text | Yes | Household name (min 1 char) |
| `invite_code` | text | Yes | 6-character unique invite code |
| `created_by` | relation | Yes | User who created the household |

**API Rules:**
- List/View: Authenticated user belongs to household OR created it
- Create: Any authenticated user
- Update/Delete: Disabled (admin only)

#### 2. `users` (extended built-in)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `household` | relation | No | Reference to user's household |
| `display_name` | text | No | User's display name |

*Plus all default PocketBase auth fields (email, password, etc.)*

#### 3. `todos`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | text | Yes | Todo description (min 1 char) |
| `due_date` | date | No | Optional due date |
| `status` | select | Yes | `pool`, `assigned`, or `done` |
| `household` | relation | Yes | Household this todo belongs to |
| `assigned_to` | relation | No | User assigned to this todo |
| `created_by` | relation | Yes | User who created the todo |

**API Rules:**
- List/View/Update/Delete: User must belong to the same household
- Create: User must belong to the household specified in the request

## Files

| File | Description |
|------|-------------|
| `pocketbase` | PocketBase binary |
| `start.sh` | Startup script |
| `setup_schema.sh` | Schema creation script |
| `pb_schema.json` | Schema documentation (JSON format) |
| `pb_data/` | SQLite database and data (gitignored) |

## API Endpoints

Base URL: `http://127.0.0.1:8090`

### Authentication
- `POST /api/collections/users/auth-with-password` - Login
- `POST /api/collections/users/records` - Register

### Households
- `GET /api/collections/households/records` - List households
- `POST /api/collections/households/records` - Create household
- `GET /api/collections/households/records/:id` - Get household

### Todos
- `GET /api/collections/todos/records` - List todos
- `POST /api/collections/todos/records` - Create todo
- `PATCH /api/collections/todos/records/:id` - Update todo
- `DELETE /api/collections/todos/records/:id` - Delete todo

### Admin
- `GET http://127.0.0.1:8090/_/` - Admin UI

## Development

### Reset Database

To start fresh, stop PocketBase and remove the data directory:

```bash
rm -rf pb_data
```

Then restart PocketBase and run the setup script again.

### View Logs

PocketBase logs are output to stdout. Use the admin UI at `/_/` to view detailed logs and manage data.
