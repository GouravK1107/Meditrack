# 🩺 Meditrack — AI-Powered Patient Symptom Tracking System

A Django-based healthcare application that tracks patient symptoms and is being built toward AI-driven analysis. Meditrack maintains structured patient profiles and logs reported symptoms over time, laying the groundwork for early detection, progress tracking, and personalized health insights.

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
![n8n](https://img.shields.io/badge/n8n-Workflow%20Automation-EA4B71?style=for-the-badge&logo=n8n&logoColor=white)
![AI](https://img.shields.io/badge/AI-Prescription%20OCR%20%2B%20Analysis-8E75B2?style=for-the-badge)

---

## 📖 Description

Meditrack provides structured user account management, secure authentication, symptom logging, AI-driven symptom analysis, and prescription image intelligence — all in one place. Patients can upload a photo of their prescription, have it read and interpreted automatically, and get automated medication reminders powered by n8n. It follows Django best practices with a modular, scalable architecture built for long-term maintainability.

---

## ✨ Key Features

- 👤 Patient profile management
- 📋 Symptom tracking and history
- 🤖 AI-based symptom analysis — pattern and trend detection across reported symptoms
- 📸 Prescription image upload + AI-powered reading — extracts medication details directly from a photographed prescription
- ⏰ Automated medication reminders via **n8n** workflow automation
- 🔐 Secure user authentication system
- 🗂️ Scalable static and media file handling
- 🧩 Modular Django application architecture

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Django (Python) |
| **Frontend** | HTML, CSS, JavaScript |
| **Database** | SQLite (development), configurable for production |
| **AI Integration** | Symptom analysis engine + prescription image reading (OCR/vision-based) |
| **Automation** | n8n — automated medication reminder workflows |

---

## 📂 Project Structure

```
Meditrack/
│
├── mainapp/            # Core symptom tracking logic
├── meditrack/           # Project settings & configuration
├── useraccount/          # Authentication & patient profile management
├── manage.py
└── README.md
```

---

## ⚙️ Installation & Setup

**1️⃣ Clone the repository**
```
git clone https://github.com/GouravK1107/Meditrack.git
cd Meditrack
```

**2️⃣ Create a virtual environment**
```
python -m venv venv
source venv/bin/activate      # Linux / macOS
venv\Scripts\activate         # Windows
```

**3️⃣ Install dependencies**
```
pip install django
```
*(A `requirements.txt` will be added as the dependency list grows — check the repo for the latest.)*

**4️⃣ Run migrations**
```
python manage.py makemigrations
python manage.py migrate
```

**5️⃣ Create a superuser (optional, for Django admin)**
```
python manage.py createsuperuser
```

**6️⃣ Run the development server**
```
python manage.py runserver
```

Open
```
http://127.0.0.1:8000/
```

---

## 📸 How Prescription Reading Works

1. Patient uploads a photo of their prescription through the app
2. The image is processed and medication details (drug name, dosage, schedule) are extracted via AI
3. Extracted data is stored against the patient's profile
4. An **n8n** workflow picks up the schedule and triggers automated reminders at the right times

---

## 📈 Project Status

**✅ Core features working end-to-end** — patient profiles, authentication, symptom tracking, AI-based symptom analysis, prescription image reading, and n8n-powered medication reminders are all functional.

---

## 🎯 Objective

To leverage AI for intelligent symptom tracking and prescription management — enabling better health monitoring, trend analysis, medication adherence, and decision support for both patients and healthcare professionals.

---

## 🔥 Roadmap

- 📊 Patient dashboard with symptom & medication history visualizations
- 🔔 Smarter alerts for concerning symptom trends
- 🐘 Production-ready PostgreSQL configuration
- ☁️ Deployment guide
- 📱 Mobile-friendly reminder notifications (SMS/push, alongside n8n)

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome.
Fork → create a branch → commit → push → open a pull request.

---

## ⭐ Support

If you found this project interesting, consider giving it a ⭐ on GitHub.

---

## 👨‍💻 Author

**Gourav R**
Backend Developer | Applied AI Developer

GitHub: https://github.com/GouravK1107
Portfolio: https://gouravk1107.github.io/my-portfolio/

---

Made with ❤️ using Django, with AI on the way.
