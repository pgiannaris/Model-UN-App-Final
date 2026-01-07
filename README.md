# Web App Examples

## Explore the Examples

### 1. Set Up

- Go to src/pocketbase.js
  - Replace the team# with your team number. For instance, if you are on team 2 you the url should read: export const dbUrl = `https://apr2025-team2.pockethost.io/`;

### 2. Sign Up with a Test Account

- You can use any email & password to sign up.
  - It is good to use something easy that you'll remember (ie. test@email.com & myPass12345!)

## The Application Setup

### Routing & Navigation Bar

- The src/App.jsx file is where you add to the navigation bar and where you define where the navigation bar leads to.

### Pages

- The src/pages/ folder holds the code for the different pages.

### Components

- Components for the navigation bar are in the src/components folder.
- Feel free to take a look and modify these components.
- Or break up your application by adding more components in the components folder.
- Most components are from Flowbite React.

### Hooks

- CRUD operations are Foundation middleware written in src/hooks/database.js
  - Including reading from and writing to a database.
- src/hooks/useAuth.js allows you to know who the user logged in is.

### Customizing the Flowbite Components

- In the src/main.tsx file you can pass a custom object to createTheme to customize the styles from Flowbite React

## The Tech Stack

### JavaScript Framework

- React - JSX, Components, Hooks
  - https://react.dev/

### Routing/Metaframework

- React Router - Allows you to go from one page to another.
  - https://reactrouter.com/

### Styling

- Tailwind 4 - Add class names to the HTML instead of using CSS

  - https://tailwindcss.com/

- Lucide - You can use lucide-react or emojis for Icons
  - https://lucide.dev/icons/

### Components Library

- Flowbite React - This project is set up with flowbite react components.
  - https://flowbite-react.com/

### Database

- SQLite with Pocketbase - stores your data kind of like a fancy spreadsheet
  - https://pocketbase.io/

### Build Tool

- Vite - builds the project and allows HMR where you change code and the preview changes on save.

### Package Manager

- pnpm - allows you to download libraries and run this project
