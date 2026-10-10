# Meditrack+

> AI-powered patient symptom tracking and prescription management using **AI-driven analysis**, **prescription image reading**, and **n8n workflow automation** to support better health monitoring and medication adherence.

---
> 💼 **Project Type: Portfolio**
>
> This project is built to showcase my skills and real-world problem solving. It is well-structured, documented, and designed with best practices in mind. Feel free to explore the code and reach out for feedback or collaboration.
>

## 📖 About the Project

**Meditrack** is a Django-based healthcare application that lets patients log their symptoms over time, upload a photo of their prescription, and receive automated medication reminders. Instead of manually tracking everything, it maintains structured patient profiles, analyzes reported symptoms for patterns and trends, and reads prescriptions automatically using AI.

The goal is to bridge everyday health tracking with modern AI, offering early detection, progress tracking, and medication adherence support for both patients and healthcare professionals.

---

## ✨ Features

- 👤 Patient profile management
- 📋 Symptom tracking and history
- 🤖 AI-based symptom analysis — pattern and trend detection across reported symptoms
- 📸 Prescription image upload + AI-powered reading — extracts medication details (drug name, dosage, schedule) from a photographed prescription
- ⏰ Automated medication reminders via **n8n** workflow automation
- 🔐 Secure user authentication system
- 🗂️ Scalable static and media file handling
- ⚡ Modular Django app structure for easy extension

---

## 🛠️ Tech Stack

| Layer              | Technology                      |
|---------------------|----------------------------------|
| Backend             | Python, Django                  |
| AI Integration      | Symptom analysis engine + prescription image reading (OCR / vision-based) |
| Automation          | n8n (medication reminder workflows) |
| Frontend            | HTML, CSS, JavaScript           |
| Database            | SQLite (development), configurable for production |

---

## 📁 Project Structure

```
Meditrack/
├── mainapp/          # Core symptom tracking logic
├── meditrack/        # Project settings & configuration
├── useraccount/      # Authentication & patient profile management
├── manage.py         # Django management script
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.x installed
- pip / virtualenv
- An n8n instance *(if you want to use automated medication reminders)*

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/GouravK1107/Meditrack.git
   cd Meditrack
   ```

2. **Create and activate a virtual environment**
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install django
   ```
   *(A `requirements.txt` will be added as the dependency list grows — check the repo for the latest.)*

4. **Apply migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create a superuser (optional, for Django admin)**
   ```bash
   python manage.py createsuperuser
   ```

6. **Run the development server**
   ```bash
   python manage.py runserver
   ```

7. Open your browser and go to:
   ```
   http://127.0.0.1:8000/
   ```

---

## 💡 Usage

1. Open the app in your browser and log in.
2. Fill in your patient profile and log your symptoms.
3. Upload a photo of your prescription.
4. The AI extracts medication details (drug name, dosage, schedule) and stores them against your profile.
5. An n8n workflow picks up the schedule and sends automated reminders at the right times.
6. Review your symptom history and AI-based trend analysis.

---

## 📈 Project Status

**✅ Core features working end-to-end** — patient profiles, authentication, symptom tracking, AI-based symptom analysis, prescription image reading, and n8n-powered medication reminders are all functional.

---

## 🗺️ Roadmap

- [ ] Patient dashboard with symptom & medication history visualizations
- [ ] Smarter alerts for concerning symptom trends
- [ ] Production-ready PostgreSQL configuration
- [ ] Deployment guide
- [ ] Mobile-friendly reminder notifications (SMS/push, alongside n8n)

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve this project:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add some feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 👤 Author

**Gourav Kumar**
GitHub: [@GouravK1107](https://github.com/GouravK1107)
Portfolio: [gouravk1107.github.io/my-portfolio](https://gouravk1107.github.io/my-portfolio/)

---

⭐ If you find this project useful, consider giving it a star!
