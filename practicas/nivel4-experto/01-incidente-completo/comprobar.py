#!/usr/bin/env python3
"""Corrige respuestas.txt de esta práctica. Uso: python3 comprobar.py [--pistas]"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "_comun"))
from lab import comprobar  # noqa: E402

if __name__ == "__main__":
    comprobar(__file__)
