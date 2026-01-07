"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var client_1 = require("react-dom/client");
var react_router_dom_1 = require("react-router-dom");
var react_query_1 = require("@tanstack/react-query");
var App_jsx_1 = __importDefault(require("./App.jsx"));
require("./index.css");
var flowbite_react_1 = require("flowbite-react");
// To customize the theme refer to:
// https://flowbite-react.com/docs/customize/theme
var customTheme = (0, flowbite_react_1.createTheme)({
    button: {
        color: {
            testColor: "bg-red-500 hover:bg-red-600",
        },
    },
});
var queryClient = new react_query_1.QueryClient();
(0, client_1.createRoot)(document.getElementById("root")).render(React.createElement(react_1.StrictMode, null,
    React.createElement(react_query_1.QueryClientProvider, { client: queryClient },
        React.createElement(react_router_dom_1.BrowserRouter, null,
            React.createElement(flowbite_react_1.ThemeProvider, { theme: customTheme },
                React.createElement(App_jsx_1.default, null))))));
