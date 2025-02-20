import express, { Request, Response } from "express";
import cors from "cors";
import schedule from "node-schedule";
import dotenv from "dotenv";
import { sendEmail } from "./emailService";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

interface ScheduleJob {
    job: schedule.Job;
    subject: string;
    text: string;
}

// na4fu5rf2st8py7hk1xr6xe

const scheduleJobs: Record<string, ScheduleJob> = {};

app.post("/schedule-email", async (req: Request, res: Response) => {
    const { to, scheduleRule, text, subject } = req.body;

    if (!to || !scheduleRule || !text || !subject) {
        res.status(400).json({ error: "L'email, la date d'envoi, le message et l'objet du mail sont requis." });
        throw new Error("Erreur");
    }

    try {
        const job = schedule.scheduleJob(scheduleRule, async () => {
            try {
                await sendEmail(to, subject, text);
            } catch (error) {
                console.error("Erreur lors de l'envoi de l'e-mail :", error);
            }
        });

        scheduleJobs[to] = { job, subject, text };
        console.log(`✅ E-mail programmé avec succès pour ${to} à ${scheduleRule}`);

        res.status(200).json({ message: `Le mail a été programmé pour ${to}.` });

    } catch (error) {
        console.error("Erreur: ", error);
        res.status(500).json({ error: "Échec lors de la programmation du mail." });
    }
});

app.post("/cancel-scheduled-email", async (req: Request, res: Response) => {
    const { to } = req.body;

    if (scheduleJobs[to]) {
        scheduleJobs[to].job.cancel();
        delete scheduleJobs[to];
        res.status(200).json({ message: "E-mail déprogrammé avec succès." });
    } else {
        res.status(404).json({ message: "Aucun e-mail trouvé pour ce destinataire." });
    }
});

app.post("/reschedule-email", async (req: Request, res: Response) => {
    const { to, reScheduleRule } = req.body;

    if (!to || !reScheduleRule) {
        res.status(400).json({ error: "L'email et la nouvelle règle de planification sont requis." });
    }

    if (scheduleJobs[to]) {
        const { subject, text } = scheduleJobs[to];

        try {
            scheduleJobs[to].job.cancel();

            const newJob = schedule.scheduleJob(reScheduleRule, async () => {
                try {
                    await sendEmail(to, subject, text);
                } catch (error) {
                    console.error("Erreur lors de l'envoi de l'e-mail :", error);
                }
            });

            scheduleJobs[to] = { job: newJob, subject, text };

            console.log(`✅ E-mail reprogrammé avec succès pour ${to} à ${reScheduleRule}`);

            res.status(200).json({ message: `Le mail a été reprogrammé pour ${to}.` });

        } catch (error) {
            console.error("Erreur: ", error);
            res.status(500).json({ error: "Échec lors de la reprogrammation du mail." });
        }
    } else {
        res.status(404).json({ message: "Aucun e-mail trouvé pour ce destinataire." });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${PORT} 🚀 [À ${new Date().toLocaleString()}]`);
});
