# MNML – Minimalist E-commerce Website

A full-stack portfolio project demonstrating a minimalist e-commerce website built with **HTML, CSS, JavaScript, Flask, and SQLite**.

The application features a responsive multi-page storefront with a Flask backend that powers site-wide product search, contact form submissions, newsletter subscriptions, and checkout logging. The frontend remains lightweight and framework-free while communicating with a REST API.

---

## Features

### Frontend

- Responsive multi-page website
- Product catalog organized into:
  - New In
  - Objects
  - Living
  - Archive
- Category and year filters
- Shopping cart with quantity management
- Cart persistence using `localStorage`
- Site-wide search with instant filtering and backend-powered search suggestions
- FAQ accordion
- Contact page
- Newsletter subscription
- Checkout flow with order confirmation

### Backend

- Flask REST API
- SQLite database
- Product catalog storage
- Site-wide search endpoint
- Contact form storage
- Newsletter signup storage
- Order logging
- Health check endpoint

---

## Tech Stack

### Frontend

- HTML5
- CSS3
- JavaScript (ES6)
- Bootstrap 5

### Backend

- Python
- Flask
- SQLite
- Gunicorn

### Deployment

- Render

---

## Skills Demonstrated

- Full-stack web development
- REST API design
- CRUD operations
- SQLite database integration
- Client-server communication using Fetch API
- Debounced search implementation
- Browser localStorage
- Responsive UI development
- Backend validation and server-side pricing
- Deployment-ready Flask application

---

## Project Structure

```
MNML/
│
├── app.py
├── build.py
├── requirements.txt
├── Procfile
├── README.md
├── .gitignore
│
├── index.html
├── new-in.html
├── objects.html
├── living.html
├── archive.html
├── contact.html
├── faq.html
├── shipping.html
├── returns.html
│
├── style.css
├── cart.css
├── cart.js
│
└── assets/  if you have any (image, logo)
```

---

## Running Locally

### Clone the repository

```bash
git clone https://github.com/yourusername/MNML.git

cd MNML
```

### Install dependencies

```bash
pip install -r requirements.txt
```

### Start the application

```bash
python app.py
```

Open your browser:

```
http://localhost:5000
```

On first launch the application automatically creates and seeds a SQLite database (`mnml.db`) with sample products.

Deleting `mnml.db` resets the application to its initial state.

---

## How It Works

### Shopping Cart

The shopping cart is entirely client-side.

- Products are stored in browser `localStorage`
- Cart persists across page navigation
- No login is required

---

### Search

The search bar combines two approaches:

#### Instant Client-side Search

As the user types, products already visible on the current page are filtered immediately.

#### Site-wide Backend Search

After a short debounce delay (~250ms), the frontend requests:

```
GET /api/search?q=keyword
```

The backend searches the complete product catalog stored in SQLite and returns matching products from every page.

---

### Contact Form

Submitting the contact form sends:

```
POST /api/contact
```

The message is stored in SQLite.

---

### Newsletter

Newsletter subscriptions are sent to:

```
POST /api/newsletter
```

Email addresses are stored in SQLite.

---

### Checkout

Checkout sends the shopping cart to:

```
POST /api/orders
```

The backend:

- validates the request
- recalculates prices using the database
- creates an order
- returns an order number

The cart is then cleared from localStorage.

---

## API Reference

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/products` | Get all products |
| GET | `/api/products/<id>` | Get product by ID |
| GET | `/api/search?q=` | Site-wide search |
| POST | `/api/contact` | Submit contact form |
| POST | `/api/newsletter` | Subscribe to newsletter |
| POST | `/api/orders` | Create an order |
| GET | `/api/orders/<id>` | Retrieve an order |
| GET | `/api/health` | Health check |

---

## Deployment

The application is deployment-ready for Render.

### Build Command

```bash
pip install -r requirements.txt
```

### Start Command

```bash
gunicorn app:app
```

Because both the frontend and backend are served by Flask, no CORS configuration is required.

---

## Database

The project uses SQLite.

The database contains tables for:

- Products
- Orders
- Contact Messages
- Newsletter Subscribers

The product catalog is automatically seeded on first startup.

---

## Known Limitations

This project is intended as a portfolio demonstration.

- No payment gateway integration
- No authentication or user accounts
- Cart is stored locally in the browser
- No admin dashboard
- Product images use placeholder emojis
- SQLite data on Render's free tier is temporary and resets after redeployment

---

## Future Improvements

Potential enhancements include:

- User authentication
- Order history
- Stripe payment integration
- Admin dashboard
- Product image uploads
- Product reviews
- Wishlist functionality
- PostgreSQL database
- Docker support
- CI/CD pipeline with GitHub Actions

---

## Screenshots
<img width="1876" height="903" alt="image" src="https://github.com/user-attachments/assets/f3fa1599-eb3a-4ca9-b80f-20e0fddd2fcf" />
<img width="530" height="917" alt="image" src="https://github.com/user-attachments/assets/dbc4ba66-8d6b-418f-b5b0-821c48e31627" />
<img width="1912" height="900" alt="image" src="https://github.com/user-attachments/assets/376284b2-5457-46cc-a32f-40e437c99ea2" />

---

## Author

**Kanika Tomar**

- GitHub: https://github.com/KanikaTomar18
- LinkedIn: https://www.linkedin.com/in/kanika-tomar-3a40a230a/

---

## License

This project is intended for educational and portfolio purposes.
