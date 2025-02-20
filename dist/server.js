"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const node_schedule_1 = __importDefault(require("node-schedule"));
const dotenv_1 = __importDefault(require("dotenv"));
const emailService_1 = require("./emailService");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const PORT = process.env.PORT || 3000;
const scheduleJobs = {};
app.post("/schedule-email", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { to, scheduleRule, text, subject } = req.body;
    if (!to || !scheduleRule || !text || !subject) {
        res.status(400).json({ error: "L'email, la date d'envoi, le message et l'objet du mail sont requis." });
        throw new Error("Erreur");
    }
    try {
        const job = node_schedule_1.default.scheduleJob(scheduleRule, () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                yield (0, emailService_1.sendEmail)(to, subject, text);
            }
            catch (error) {
                console.error("Erreur lors de l'envoi de l'e-mail :", error);
            }
        }));
        scheduleJobs[to] = { job, subject, text };
        console.log(`✅ E-mail programmé avec succès pour ${to} à ${scheduleRule}`);
        res.status(200).json({ message: `Le mail a été programmé pour ${to}.` });
    }
    catch (error) {
        console.error("Erreur: ", error);
        res.status(500).json({ error: "Échec lors de la programmation du mail." });
    }
}));
app.post("/cancel-scheduled-email", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { to } = req.body;
    if (scheduleJobs[to]) {
        scheduleJobs[to].job.cancel();
        delete scheduleJobs[to];
        res.status(200).json({ message: "E-mail déprogrammé avec succès." });
    }
    else {
        res.status(404).json({ message: "Aucun e-mail trouvé pour ce destinataire." });
    }
}));
app.post("/reschedule-email", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { to, reScheduleRule } = req.body;
    if (!to || !reScheduleRule) {
        res.status(400).json({ error: "L'email et la nouvelle règle de planification sont requis." });
    }
    if (scheduleJobs[to]) {
        const { subject, text } = scheduleJobs[to];
        try {
            scheduleJobs[to].job.cancel();
            const newJob = node_schedule_1.default.scheduleJob(reScheduleRule, () => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    yield (0, emailService_1.sendEmail)(to, subject, text);
                }
                catch (error) {
                    console.error("Erreur lors de l'envoi de l'e-mail :", error);
                }
            }));
            scheduleJobs[to] = { job: newJob, subject, text };
            console.log(`✅ E-mail reprogrammé avec succès pour ${to} à ${reScheduleRule}`);
            res.status(200).json({ message: `Le mail a été reprogrammé pour ${to}.` });
        }
        catch (error) {
            console.error("Erreur: ", error);
            res.status(500).json({ error: "Échec lors de la reprogrammation du mail." });
        }
    }
    else {
        res.status(404).json({ message: "Aucun e-mail trouvé pour ce destinataire." });
    }
}));
app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${PORT} 🚀 [À ${new Date().toLocaleString()}]`);
});
