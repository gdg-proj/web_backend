"use strict";
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const express_session_1 = __importDefault(require("express-session"));
const dotenv_1 = __importDefault(require("dotenv"));
const app = (0, express_1.default)();
dotenv_1.default.config();
const PORT = process.env.PORT || 5001;
app.use(express_1.default.json());
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));
app.use((0, cors_1.default)({ origin: "*", credentials: true }));
mongoose_1.default.connect(process.env.MONGODB_URL)
    .then(() => {
    console.log("Databse connected");
})
    .catch((err) => {
    console.log(err);
});
app.use("/auth", auth_route_1.default);
app.listen(PORT, () => {
    console.log(`Server started at port ${PORT}`);
}).on("error", (err) => {
    console.error("Failed to start server:", err);
});
