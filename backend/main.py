"""REST API for the Exam Score Prediction model.

Run from the project root:  uvicorn backend.main:app --reload
"""
import json
from typing import Literal

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from src import config
from src.predict import NEW_STUDENTS, load_model

Level = Literal["Low", "Medium", "High"]
YesNo = Literal["No", "Yes"]


class Student(BaseModel):
    """One student's 19 factors. Ranges and categories match the training data."""

    Hours_Studied: int = Field(ge=0, le=45)
    Attendance: int = Field(ge=50, le=100)
    Previous_Scores: int = Field(ge=40, le=100)
    Tutoring_Sessions: int = Field(ge=0, le=8)
    Sleep_Hours: int = Field(ge=4, le=10)
    Physical_Activity: int = Field(ge=0, le=6)
    Motivation_Level: Level
    Extracurricular_Activities: YesNo
    Access_to_Resources: Level
    Internet_Access: YesNo
    Teacher_Quality: Level
    School_Type: Literal["Public", "Private"]
    Peer_Influence: Literal["Negative", "Neutral", "Positive"]
    Parental_Involvement: Level
    Parental_Education_Level: Literal["High School", "College", "Postgraduate"]
    Family_Income: Level
    Distance_from_Home: Literal["Far", "Moderate", "Near"]
    Learning_Disabilities: YesNo
    Gender: Literal["Female", "Male"]


# Display details for each feature, in the order the form shows them.
FEATURE_INFO = {
    "Hours_Studied": ("Academic", "Hours studied", "hours per week", 20),
    "Attendance": ("Academic", "Attendance", "%", 80),
    "Previous_Scores": ("Academic", "Previous exam score", "marks", 75),
    "Tutoring_Sessions": ("Academic", "Tutoring sessions", "per month", 1),
    "Sleep_Hours": ("Lifestyle", "Sleep", "hours per night", 7),
    "Physical_Activity": ("Lifestyle", "Physical activity", "hours per week", 3),
    "Motivation_Level": ("Lifestyle", "Motivation level", None, "Medium"),
    "Extracurricular_Activities": ("Lifestyle", "Extracurricular activities", None, "Yes"),
    "Access_to_Resources": ("School", "Access to resources", None, "Medium"),
    "Internet_Access": ("School", "Internet access", None, "Yes"),
    "Teacher_Quality": ("School", "Teacher quality", None, "Medium"),
    "School_Type": ("School", "School type", None, "Public"),
    "Peer_Influence": ("School", "Peer influence", None, "Neutral"),
    "Parental_Involvement": ("Family", "Parental involvement", None, "Medium"),
    "Parental_Education_Level": ("Family", "Parental education", None, "College"),
    "Family_Income": ("Family", "Family income", None, "Medium"),
    "Distance_from_Home": ("Family", "Distance from home", None, "Moderate"),
    "Learning_Disabilities": ("Family", "Learning disabilities", None, "No"),
    "Gender": ("Family", "Gender", None, "Female"),
}

model = load_model()
preprocessor = model.named_steps["preprocess"]
regressor = model.named_steps["model"]


def _average_student():
    """Encoded feature values of the average student, the reference point for contributions."""
    if not config.PROCESSED_DATA.exists():
        return None
    data = pd.read_csv(config.PROCESSED_DATA)[config.ALL_FEATURES]
    return preprocessor.transform(data).mean(axis=0)


reference = _average_student()
baseline = float(regressor.intercept_ + (regressor.coef_ @ reference if reference is not None else 0.0))


def _feature_schema():
    features = []
    for name, (group, label, unit, default) in FEATURE_INFO.items():
        field = Student.model_fields[name]
        item = {"name": name, "group": group, "label": label, "default": default}
        if name in config.NUMERIC_FEATURES:
            limits = {type(m).__name__: m for m in field.metadata}
            item |= {"type": "number", "unit": unit, "min": limits["Ge"].ge, "max": limits["Le"].le}
        else:
            options = config.ORDINAL_FEATURES.get(name) or config.BINARY_FEATURES[name]
            item |= {"type": "choice", "options": options}
        features.append(item)
    return features


app = FastAPI(title="Exam Score Prediction API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])


@app.get("/api/health")
def health():
    return {"status": "ok", "model": config.FINAL_MODEL}


@app.get("/api/schema")
def schema():
    presets = [
        {"name": s["Profile"], "values": {k: v for k, v in s.items() if k != "Profile"}} for s in NEW_STUDENTS
    ]
    return {"groups": ["Academic", "Lifestyle", "School", "Family"], "features": _feature_schema(), "presets": presets}


@app.get("/api/model-info")
def model_info():
    try:
        with open(config.RESULTS_DIR / "metrics.json") as f:
            metrics = json.load(f)
        comparison = pd.read_csv(config.RESULTS_DIR / "model_comparison.csv")
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="Results not found. Run 'python -m src.train' first.")
    return {
        "model": metrics["final_model"],
        "train_rows": metrics["train_rows"],
        "test_rows": metrics["test_rows"],
        "test_metrics": metrics["final_test_metrics"],
        "comparison": [
            {"model": r.Model, "mae": r.Test_MAE, "rmse": r.Test_RMSE, "r2": r.Test_R2}
            for r in comparison.itertuples()
        ],
    }


@app.post("/api/predict")
def predict(student: Student):
    row = pd.DataFrame([student.model_dump()])[config.ALL_FEATURES]
    encoded = preprocessor.transform(row)[0]
    raw = float(regressor.intercept_ + regressor.coef_ @ encoded)

    # A linear model is a sum, so each feature's share of the score can be read off exactly:
    # its coefficient times how far this student is from the average student on that feature.
    offset = encoded - reference if reference is not None else encoded
    contributions = [
        {"name": name, "label": FEATURE_INFO[name][1], "value": getattr(student, name), "marks": float(c * d)}
        for name, c, d in zip(config.ALL_FEATURES, regressor.coef_, offset)
    ]
    contributions.sort(key=lambda c: abs(c["marks"]), reverse=True)

    return {
        "score": min(max(raw, 0.0), 100.0),
        "raw_score": raw,
        "clipped": not 0.0 <= raw <= 100.0,
        "baseline": baseline,
        "contributions": contributions,
    }


# In production the built frontend is served from here, so one command runs the whole app.
FRONTEND_DIST = config.ROOT / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
