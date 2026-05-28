from __future__ import annotations

import sqlite3
from datetime import date, datetime
from functools import wraps
from pathlib import Path

from flask import Flask, flash, g, jsonify, redirect, render_template, request, session, url_for

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "nutri.db"
CLINIC_NAME = "Nutri GC"
SECRET_KEY = "cambia-esta-clave-en-produccion"

app = Flask(__name__)
app.config["SECRET_KEY"] = SECRET_KEY


def get_db() -> sqlite3.Connection:
    if "db" not in g:
        connection = sqlite3.connect(DB_PATH)
        connection.row_factory = sqlite3.Row
        g.db = connection
    return g.db


@app.teardown_appcontext
def close_db(_exception: BaseException | None) -> None:
    database = g.pop("db", None)
    if database is not None:
        database.close()


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS patients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL UNIQUE,
                age INTEGER NOT NULL,
                height_cm REAL NOT NULL,
                weight_kg REAL NOT NULL,
                bmi REAL NOT NULL,
                diagnosis TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS consultations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER NOT NULL,
                consult_date TEXT NOT NULL,
                consult_time TEXT NOT NULL,
                evolution TEXT NOT NULL,
                meal_plan TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
            );
            """
        )


@app.before_request
def ensure_db() -> None:
    init_db()


def login_required(view):
    @wraps(view)
    def wrapped_view(*args, **kwargs):
        if "nutri_name" not in session:
            return redirect(url_for("login"))
        return view(*args, **kwargs)

    return wrapped_view


def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    height_m = height_cm / 100
    if height_m <= 0:
        return 0.0
    return round(weight_kg / (height_m * height_m), 2)


def diagnose_bmi(bmi: float) -> str:
    if bmi < 18.5:
        return "Bajo peso"
    if bmi < 25:
        return "Peso normal"
    if bmi < 30:
        return "Sobrepeso"
    return "Obesidad"


def normalize_text(value: str) -> str:
    return " ".join(value.split())


@app.route("/")
def index():
    if "nutri_name" in session:
        return redirect(url_for("dashboard"))
    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        nutri_name = normalize_text(request.form.get("nutri_name", ""))
        if not nutri_name:
            flash("Escribe tu nombre para entrar.", "error")
            return render_template("login.html", clinic_name=CLINIC_NAME)

        session["nutri_name"] = nutri_name
        flash(f"Bienvenido, {nutri_name}.", "success")
        return redirect(url_for("dashboard"))

    return render_template("login.html", clinic_name=CLINIC_NAME)


@app.route("/logout")
def logout():
    session.clear()
    flash("Sesión cerrada.", "success")
    return redirect(url_for("login"))


@app.route("/dashboard")
@login_required
def dashboard():
    db = get_db()
    patients = db.execute(
        """
        SELECT id, full_name, age, height_cm, weight_kg, bmi, diagnosis, updated_at
        FROM patients
        ORDER BY full_name COLLATE NOCASE ASC
        """
    ).fetchall()

    consultation_rows = db.execute(
        """
        SELECT c.id, c.consult_date, c.consult_time, c.evolution, c.meal_plan,
               p.full_name AS patient_name, p.bmi, p.diagnosis
        FROM consultations c
        JOIN patients p ON p.id = c.patient_id
        ORDER BY c.consult_date DESC, c.consult_time DESC, c.id DESC
        LIMIT 12
        """
    ).fetchall()

    consultations = [
        {
            "id": row["id"],
            "consult_date": row["consult_date"],
            "consult_time": row["consult_time"],
            "evolution": row["evolution"],
            "meal_plan": row["meal_plan"],
            "patient_name": row["patient_name"],
            "bmi": row["bmi"],
            "diagnosis": row["diagnosis"],
        }
        for row in consultation_rows
    ]

    return render_template(
        "dashboard.html",
        clinic_name=CLINIC_NAME,
        nutri_name=session["nutri_name"],
        patients=patients,
        consultations=consultations,
        today=date.today().isoformat(),
        now_time=datetime.now().strftime("%H:%M"),
    )


@app.route("/patients", methods=["POST"])
@login_required
def save_patient():
    full_name = normalize_text(request.form.get("full_name", ""))
    age_raw = request.form.get("age", "").strip()
    height_raw = request.form.get("height_cm", "").strip()
    weight_raw = request.form.get("weight_kg", "").strip()

    if not full_name or not age_raw or not height_raw or not weight_raw:
        flash("Completa todos los campos del preregistro.", "error")
        return redirect(url_for("dashboard"))

    try:
        age = int(age_raw)
        height_cm = float(height_raw)
        weight_kg = float(weight_raw)
    except ValueError:
        flash("Edad, estatura y peso deben ser numéricos.", "error")
        return redirect(url_for("dashboard"))

    if age <= 0 or height_cm <= 0 or weight_kg <= 0:
        flash("Los valores deben ser mayores a cero.", "error")
        return redirect(url_for("dashboard"))

    bmi = calculate_bmi(weight_kg, height_cm)
    diagnosis = diagnose_bmi(bmi)
    timestamp = datetime.now().isoformat(timespec="seconds")

    db = get_db()
    existing_patient = db.execute(
        "SELECT id FROM patients WHERE full_name = ?",
        (full_name,),
    ).fetchone()

    if existing_patient:
        db.execute(
            """
            UPDATE patients
            SET age = ?, height_cm = ?, weight_kg = ?, bmi = ?, diagnosis = ?, updated_at = ?
            WHERE id = ?
            """,
            (age, height_cm, weight_kg, bmi, diagnosis, timestamp, existing_patient["id"]),
        )
        flash(f"Paciente actualizado: {full_name}.", "success")
    else:
        db.execute(
            """
            INSERT INTO patients (full_name, age, height_cm, weight_kg, bmi, diagnosis, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (full_name, age, height_cm, weight_kg, bmi, diagnosis, timestamp, timestamp),
        )
        flash(f"Paciente guardado: {full_name}.", "success")

    db.commit()
    return redirect(url_for("dashboard"))


@app.route("/consultations", methods=["POST"])
@login_required
def save_consultation():
    patient_id_raw = request.form.get("patient_id", "").strip()
    consult_date = request.form.get("consult_date", date.today().isoformat()).strip()
    consult_time = request.form.get("consult_time", datetime.now().strftime("%H:%M")).strip()
    evolution = normalize_text(request.form.get("evolution", ""))
    meal_plan = normalize_text(request.form.get("meal_plan", ""))

    if not patient_id_raw or not evolution or not meal_plan:
        flash("Selecciona un paciente y completa la evolución y el plan.", "error")
        return redirect(url_for("dashboard"))

    try:
        patient_id = int(patient_id_raw)
    except ValueError:
        flash("Paciente inválido.", "error")
        return redirect(url_for("dashboard"))

    db = get_db()
    patient = db.execute(
        "SELECT id FROM patients WHERE id = ?",
        (patient_id,),
    ).fetchone()

    if patient is None:
        flash("El paciente seleccionado no existe.", "error")
        return redirect(url_for("dashboard"))

    timestamp = datetime.now().isoformat(timespec="seconds")
    db.execute(
        """
        INSERT INTO consultations (patient_id, consult_date, consult_time, evolution, meal_plan, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (patient_id, consult_date, consult_time, evolution, meal_plan, timestamp),
    )
    db.commit()
    flash("Consulta guardada correctamente.", "success")
    return redirect(url_for("dashboard"))


@app.route("/api/history")
@login_required
def api_history():
    db = get_db()
    rows = db.execute(
        """
        SELECT c.id, c.consult_date, c.consult_time, c.evolution, c.meal_plan,
               p.full_name AS patient_name, p.bmi, p.diagnosis
        FROM consultations c
        JOIN patients p ON p.id = c.patient_id
        ORDER BY c.consult_date DESC, c.consult_time DESC, c.id DESC
        LIMIT 20
        """
    ).fetchall()

    history = [
        {
            "id": row["id"],
            "patient_name": row["patient_name"],
            "consult_date": row["consult_date"],
            "consult_time": row["consult_time"],
            "evolution": row["evolution"],
            "meal_plan": row["meal_plan"],
            "bmi": row["bmi"],
            "diagnosis": row["diagnosis"],
        }
        for row in rows
    ]
    return jsonify(history=history, updated_at=datetime.now().isoformat(timespec="seconds"))


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
