| Operation      | Endpoint                    |
| -------------- | --------------------------- |
| List subtasks  | `/api/tasks/{id}/subtasks/` |
| Create subtask | `/api/tasks/{id}/subtasks/` |
| Update subtask | `/api/subtasks/{id}/`       |
| Delete subtask | `/api/subtasks/{id}/`       |
| Reorder        | `/api/subtasks/reorder/`    |

GET /api/tasks/
/api/tasks/?status=pending&priority=high
/api/tasks/?search=meeting
/api/tasks/?ordering=due_date

POST /api/tasks/
GET /api/tasks/{task_id}/
PATCH /api/tasks/{task_id}/
DELETE /api/tasks/{task_id}/
POST /api/tasks/{task_id}/complete/

GET /api/tasks/{task_id}/subtasks/
POST /api/tasks/{task_id}/subtasks/
POST /api/subtasks/ **don't use it**
PATCH /api/subtasks/{subtask_id}/
DELETE /api/subtasks/{subtask_id}/





Below is a **clean, permanent reference document** you should keep.
This is not tutorial material — this is **engineering documentation** you can return to anytime without confusion.

Save this as:

```
TASKMASTER_BACKEND_ENGINEERING_NOTES.md
```

---

# TaskMaster Backend — Core Engineering Documentation

This document captures the **why, what, and how** of the backend architecture so future changes do not break design principles.

---

## 1. Authentication Architecture (JWT)

### Authentication Type

* Stateless authentication using JWT
* Backend does NOT store sessions
* Frontend stores tokens

### Tokens

| Token | Purpose | Lifetime |
|------|--------|
| Access token | API authorization | Short (5–15 min) |
| Refresh token | Issue new access token | Long (days) |

### Core APIs

```
POST /api/auth/register/
POST /api/auth/login/
POST /api/auth/token/refresh/
GET  /api/auth/me/
POST /api/auth/logout/   (blacklist refresh)
```

### Flow

1. User logs in
2. Backend returns:

   * access
   * refresh
3. Frontend:

   * Stores access token in memory
   * Stores refresh token securely
4. Every API request:

   ```
   Authorization: Bearer <access_token>
   ```
5. On 401 → refresh → retry

### Rules

* Access token is NEVER stored in DB
* Refresh token may be blacklisted
* Backend remains stateless

---

## 2. User Ownership Rule (CRITICAL)

Every object must belong to a user.

Example:

```python
Task.user = request.user
SubTask.parent_task.user
Tag.user
```

### Never trust frontend user IDs.

Always use:

```python
request.user
```

This rule prevents:

* Data leaks
* ID spoofing
* Cross-user access

---

## 3. Core Domain Models

### Task

Represents a main unit of work.

Key fields:

* id (UUID)
* user (owner)
* title
* priority
* status
* due_date / due_time
* completed_at
* is_active (soft delete)
* timestamps

### SubTask

Represents breakdown of a task.

Key rules:

* Belongs to exactly ONE task
* Has independent completion
* Ordered using `order_index`

### Tag

User-defined categorization system.

Rules:

* Tags are per-user
* Same tag name allowed across users
* Unique per user

### TaskTag (through table)

Handles many-to-many relationship.

Reason:

* Allows metadata later
* Prevents implicit Django join table limitations

---

## 4. Soft Delete Pattern

### Why soft delete?

* Recovery
* Audit logs
* Analytics
* Undo actions

### Implementation

```python
is_active = models.BooleanField(default=True)
```

Never delete tasks physically.

Instead:

```python
task.is_active = False
task.save()
```

Query only active tasks:

```python
Task.objects.filter(is_active=True)
```

---

## 5. API Design Philosophy

### Nested for context

```
/api/tasks/{id}/subtasks/
```

Used for:

* UI screens
* Creation
* Context awareness

### Flat for control

```
/api/subtasks/{id}/
```

Used for:

* Update
* Delete
* Reorder
* Drag & drop

### Rule

* READ = nested
* WRITE = flat

This avoids nested mutation complexity.

---

## 6. Task APIs (Final)

### Task

```
GET    /api/tasks/
POST   /api/tasks/
GET    /api/tasks/{id}/
PATCH  /api/tasks/{id}/
DELETE /api/tasks/{id}/   (soft delete)
```

### Task Actions

```
POST /api/tasks/{id}/complete/
```

### Subtasks

```
GET    /api/tasks/{id}/subtasks/
POST   /api/tasks/{id}/subtasks/

PATCH  /api/subtasks/{id}/
DELETE /api/subtasks/{id}/
POST   /api/subtasks/reorder/
```

### Tags

Implicitly handled during task creation/update.

---

## 7. Serializer Architecture

### Read serializer

Used for:

* GET endpoints
* Nested display
* UI hydration

```python
TaskSerializer
```

Contains:

* tags
* subtasks
* owner

### Write serializer

Used for:

* create
* update
* partial_update

```python
TaskCreateUpdateSerializer
```

Handles:

* atomic transactions
* tag creation
* subtask creation
* validation

### Important rule

Never mix read/write serializers.

This prevents:

* accidental writes
* nested update bugs
* security leaks

---

## 8. Transactions

Always use transactions when writing multiple tables.

Example:

```python
with transaction.atomic():
    create task
    create tags
    create subtasks
```

If ANY step fails:

* Entire operation rolls back

This prevents partial data corruption.

---

## 9. Filtering, Searching, Ordering

### Filtering (django-filter)

```
status
priority
due_date__gte
due_date__lte
tags
```

### Searching

```
title
description
tags__name
```

### Ordering

```
due_date
priority
created_at
```

Always done at database level.

Never filter in Python.

---

## 10. Permissions

### Object-level permission

```python
obj.user == request.user
```

Implemented using:

```python
IsOwnerOrReadOnly
```

Ensures:

* Only owners modify data
* Safe methods allowed globally

---

## 11. Subtask Reordering

### Why `order_index`

Because databases do not preserve order.

Frontend sends:

```json
[
  { "id": "...", "order_index": 0 },
  { "id": "...", "order_index": 1 }
]
```

Backend updates using bulk transaction.

Result:

* Drag & drop works
* Stable ordering
* No race conditions

---

## 12. completed_at logic

Both Task and SubTask can be completed independently.

Rules:

* Setting status = completed
* Set completed_at = timezone.now()

Never auto-complete parent task unless explicitly designed.

---

## 13. Admin Panel (minimal)

Register models for debugging only:

```python
admin.site.register(Task)
admin.site.register(SubTask)
admin.site.register(Tag)
```

Admin is NOT your product UI.

Only for developers.

---

## 14. What NOT to do

❌ Never trust frontend IDs
❌ Never delete production data
❌ Never store JWT in DB
❌ Never mix read/write serializers
❌ Never write nested updates without transactions

---