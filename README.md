# Cicada Construction Remodeling - Project Management Dashboard

This is a comprehensive project management dashboard for Cicada Construction Remodeling, built with Next.js and a SQLite backend. It provides tools for managing proposals, residential projects, and administrative data like builders, estimators, and project statuses.

## Features

- **Proposal Log:** View, add, edit, and filter project proposals.
- **Residential Log:** A dedicated view for residential projects with a tabbed interface for:
    - All Projects
    - Upcoming Schedule
    - Ongoing Projects
- **Project Details View:** A detailed view for each project, showing contacts, notes, and drawings.
- **Admin Panel:** A centralized page for managing core data entities:
    - Builders
    - Estimators
    - Supervisors
    - Locations
    - Project Statuses
- **Search and Filtering:** Robust search and filtering capabilities across different modules.
- **Data Import/Export:** Functionality to import and export project data.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) 13+ (with App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Database:** [SQLite](https://www.sqlite.org/index.html)
- **Icons:** [React Icons](https://react-icons.github.io/react-icons/)

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd dashboard-nextjs
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up the database:**
    This project uses a SQLite database. A complete schema with pre-populated data is available in `final_schema.sql`. To set up your local database, you will first need to have the `sqlite3` command-line tool installed on your system. Then, run the following command from the project root:
    ```bash
    sqlite3 database.db < final_schema.sql
    ```
    This will create a `database.db` file with all the necessary tables and data to run the application.

4.  **Run the development server:**
    ```bash
    npm run dev

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- **`/app`**: Contains all the routes, pages, and API endpoints, following the Next.js App Router structure.
- **`/components`**: Contains all the reusable React components used throughout the application.
- **`/lib`**: Contains library code, such as the database connection setup (`db.js`).
- **`/public`**: Contains static assets like images and fonts.
- **`/*.sql`**: SQL scripts for database schema creation and migration.
- **`/*.js`**: Standalone scripts for database migrations.
