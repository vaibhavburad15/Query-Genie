#  Query Genie


Query Genie is an intelligent database assistant that allows users to interact with their databases using natural language. Powered by AI, it converts your questions into SQL queries and presents results in beautiful, interactive tables.


## ✨ Features

- 🤖 **Natural Language Processing** - Ask questions in plain English
- 🗄️ **Multi-Database Support** - Connect to MySQL, PostgreSQL databases
- 📊 **Interactive Data Tables** - Sort, search, and export query results
- 🔒 **Secure Authentication** - User registration with email OTP verification
- 💬 **Chat History** - Save and manage multiple conversation sessions
- ⚠️ **Safety Confirmations** - Warns before executing destructive operations
- 🎨 **Modern UI** - Clean, responsive interface built with React and Tailwind CSS
- 📈 **Real-time Results** - View SQL queries and results instantly
- 🔄 **Context-Aware** - Maintains conversation history for better query generation

### Backend Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/query-genie.git
cd query-genie
```
2. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

3. **Create `.env` file in the root directory**
```env
# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here

# Email Configuration (Gmail)
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password_here
```

> **Note**: For Gmail, you need to create an [App Password](https://support.google.com/accounts/answer/185833). Regular passwords won't work.

5. **Run the backend server**
```bash
uvicorn backend:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory** (if separate)
```bash
cd Query-frontend
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Start the development server**
```bash
npm run dev
# or
yarn dev
```

The frontend will be available at `http://localhost:5173` (or the port shown in terminal)

## 🗄️ Database Configuration

### Setting up MySQL Database

1. **Create a MySQL database**
```sql
CREATE DATABASE your_database_name;
USE your_database_name;
```

2. **Create sample tables** (optional)
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    amount DECIMAL(10, 2),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

3. **Connect in Query Genie**
   - Click "Connect Database" button
   - Enter your MySQL credentials:
     - Host: `localhost` (or your MySQL host)
     - Port: `3306` (default MySQL port)
     - Username: Your MySQL username
     - Password: Your MySQL password
     - Database: Your database name

## 💡 Usage Examples

### Example Questions

Once connected to your database, try asking:

- **Simple queries**
  - "Show me all users"
  - "How many orders are there?"
  - "What are the table names?"

- **Aggregations**
  - "What is the average order amount?"
  - "Show me total sales by user"
  - "Count orders by status"

- **Joins**
  - "Show me users with their orders"
  - "Find users who have never placed an order"
  - "List top 5 users by order count"

- **Filtering**
  - "Show orders from the last 30 days"
  - "Find users whose email contains 'gmail'"
  - "List orders greater than $100"

- **Data modifications** (with confirmation)
  - "Delete orders older than 1 year"
  - "Update user status to active"
  - "Create a new table for products"

### Getting API Keys

1. **Groq API Key**
   - Visit [Groq Console](https://console.groq.com/)
   - Sign up for a free account
   - Generate an API key from the dashboard

2. **Gmail App Password**
   - Enable 2-factor authentication on your Google account
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Generate a new app password for "Mail"
   - Use this password in your `.env` file

## 🛡️ Security Features

- **Password Hashing** - Bcrypt encryption for user passwords
- **OTP Verification** - Email-based one-time passwords for signup
- **SQL Injection Protection** - Parameterized queries via SQLAlchemy
- **Destructive Operation Warnings** - Confirmation required for DELETE, DROP, UPDATE, etc.
- **Connection Pooling** - Efficient database connection management
- **Input Validation** - Pydantic models for request validation


## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [LangChain](https://langchain.com/) - LLM application framework
- [Groq](https://groq.com/) - Fast LLM inference
- [React](https://react.dev/) - Frontend framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components

## 📧 Contact

For questions or support, please open an issue on GitHub.

## Upcoming Features

- [ ] Support for PostgreSQL and SQLite
- [ ] Excel/CSV file upload and querying
- [ ] Multi-user collaboration
- [ ] Query templates library
- [ ] Dark mode support

## 📝 License

📄 License This project is licensed under the MIT License.

👤 Author Vaibhav burad GitHub: https://github.com/vaibhavburad15 Linkedin: https://www.linkedin.com/in/vaibhav-burad-278414243/

Made with ❤️ by the Vaibhav burad
