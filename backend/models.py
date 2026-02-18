"""
API Data Models for Fermi-Dirac Distribution Service

Pydantic models for request validation and response serialization.
All energy values are in electron-volts (eV) and temperatures in Kelvin (K).
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from enum import Enum


class EnergySpacing(str, Enum):
    """Energy grid spacing options."""
    LINEAR = "linear"
    LOGARITHMIC = "log"


# ============== Request Models ==============

class FermiDiracRequest(BaseModel):
    """
    Request model for single Fermi-Dirac calculation.
    
    Attributes:
        temperature: Temperature in Kelvin (0 for T→0 limit)
        mu: Chemical potential / Fermi level in eV
        energy_min: Minimum energy for calculation (eV)
        energy_max: Maximum energy for calculation (eV)
        points: Number of energy grid points
    """
    temperature: float = Field(
        default=300.0,
        ge=0,
        le=1e6,
        description="Temperature in Kelvin"
    )
    mu: float = Field(
        default=0.5,
        ge=-10,
        le=10,
        description="Chemical potential (Fermi level) in eV"
    )
    energy_min: float = Field(
        default=-1.0,
        ge=-100,
        le=100,
        description="Minimum energy in eV"
    )
    energy_max: float = Field(
        default=2.0,
        ge=-100,
        le=100,
        description="Maximum energy in eV"
    )
    points: int = Field(
        default=500,
        ge=10,
        le=10000,
        description="Number of energy grid points"
    )
    
    @field_validator('energy_max')
    @classmethod
    def energy_max_greater_than_min(cls, v, info):
        if 'energy_min' in info.data and v <= info.data['energy_min']:
            raise ValueError('energy_max must be greater than energy_min')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "temperature": 300,
                "mu": 0.5,
                "energy_min": -1,
                "energy_max": 2,
                "points": 500
            }
        }


class MultiTemperatureRequest(BaseModel):
    """
    Request model for multi-temperature Fermi-Dirac calculation.
    
    Used for overlay plots comparing different temperature regimes.
    """
    temperatures: List[float] = Field(
        default=[0, 100, 300, 1000, 3000],
        min_length=1,
        max_length=20,
        description="List of temperatures in Kelvin"
    )
    mu: float = Field(
        default=0.5,
        ge=-10,
        le=10,
        description="Chemical potential in eV"
    )
    energy_min: float = Field(
        default=-1.0,
        description="Minimum energy in eV"
    )
    energy_max: float = Field(
        default=2.0,
        description="Maximum energy in eV"
    )
    points: int = Field(
        default=500,
        ge=10,
        le=5000,
        description="Number of energy grid points"
    )
    include_maxwell_boltzmann: bool = Field(
        default=False,
        description="Include Maxwell-Boltzmann comparison curves"
    )
    
    @field_validator('temperatures')
    @classmethod
    def validate_temperatures(cls, v):
        if any(t < 0 for t in v):
            raise ValueError('All temperatures must be non-negative')
        return sorted(set(v))  # Remove duplicates and sort

    class Config:
        json_schema_extra = {
            "example": {
                "temperatures": [0, 100, 300, 1000, 3000],
                "mu": 0.5,
                "energy_min": -1,
                "energy_max": 2,
                "points": 500,
                "include_maxwell_boltzmann": False
            }
        }


class SurfaceRequest(BaseModel):
    """
    Request model for 2D surface/heatmap calculation f(E, T).
    """
    mu: float = Field(
        default=0.5,
        description="Chemical potential in eV"
    )
    energy_min: float = Field(
        default=-1.0,
        description="Minimum energy in eV"
    )
    energy_max: float = Field(
        default=2.0,
        description="Maximum energy in eV"
    )
    energy_points: int = Field(
        default=200,
        ge=10,
        le=1000,
        description="Number of energy grid points"
    )
    temp_min: float = Field(
        default=1.0,
        ge=0.1,
        description="Minimum temperature in K"
    )
    temp_max: float = Field(
        default=5000.0,
        le=1e6,
        description="Maximum temperature in K"
    )
    temp_points: int = Field(
        default=100,
        ge=10,
        le=500,
        description="Number of temperature grid points"
    )
    temp_scale: str = Field(
        default="log",
        pattern="^(linear|log)$",
        description="Temperature axis scale: 'linear' or 'log'"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "mu": 0.5,
                "energy_min": -1.0,
                "energy_max": 2.0,
                "energy_points": 200,
                "temp_min": 1.0,
                "temp_max": 5000.0,
                "temp_points": 100,
                "temp_scale": "log"
            }
        }


# ============== Response Models ==============

class FermiDiracResponse(BaseModel):
    """
    Response model for single Fermi-Dirac calculation.
    """
    energy: List[float] = Field(description="Energy values (eV)")
    occupation: List[float] = Field(description="Occupation probability f(E)")
    temperature: float = Field(description="Temperature (K)")
    mu: float = Field(description="Chemical potential (eV)")
    thermal_width: float = Field(description="Thermal smearing width ~4kT (eV)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "energy": [-1.0, -0.5, 0.0, 0.5, 1.0],
                "occupation": [1.0, 1.0, 0.99, 0.5, 0.01],
                "temperature": 300,
                "mu": 0.5,
                "thermal_width": 0.103
            }
        }


class MultiTemperatureCurve(BaseModel):
    """Single temperature curve data."""
    temperature: float
    occupation: List[float]
    maxwell_boltzmann: Optional[List[float]] = None


class MultiTemperatureResponse(BaseModel):
    """
    Response model for multi-temperature calculation.
    """
    energy: List[float] = Field(description="Energy values (eV)")
    curves: List[MultiTemperatureCurve] = Field(
        description="Occupation curves for each temperature"
    )
    mu: float = Field(description="Chemical potential (eV)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "energy": [-1.0, 0.0, 0.5, 1.0, 2.0],
                "curves": [
                    {"temperature": 0, "occupation": [1.0, 1.0, 0.5, 0.0, 0.0]},
                    {"temperature": 300, "occupation": [1.0, 0.99, 0.5, 0.01, 0.0]}
                ],
                "mu": 0.5
            }
        }


class SurfaceResponse(BaseModel):
    """
    Response model for 2D surface calculation.
    """
    energy: List[float] = Field(description="Energy values (eV)")
    temperatures: List[float] = Field(description="Temperature values (K)")
    occupation: List[List[float]] = Field(
        description="2D occupation array [temp_idx][energy_idx]"
    )
    mu: float = Field(description="Chemical potential (eV)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "energy": [-1.0, 0.0, 1.0],
                "temperatures": [100, 300, 1000],
                "occupation": [
                    [1.0, 0.99, 0.01],
                    [1.0, 0.95, 0.05],
                    [0.99, 0.8, 0.2]
                ],
                "mu": 0.5
            }
        }


class ZeroTemperatureResponse(BaseModel):
    """
    Response model for T=0 Heaviside step function.
    """
    energy: List[float]
    occupation: List[float]
    mu: float
    description: str = "Ideal Heaviside step function at T=0 (Pauli exclusion)"


class PhysicsInfoResponse(BaseModel):
    """
    Response with physical constants and information.
    """
    k_B_eV: float = Field(description="Boltzmann constant in eV/K")
    k_B_SI: float = Field(description="Boltzmann constant in J/K")
    equation: str = Field(description="Fermi-Dirac equation in LaTeX")
    regimes: dict = Field(description="Physical regime descriptions")
