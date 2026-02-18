"""
Fermi-Dirac Distribution API Server

A FastAPI backend for computing the Fermi-Dirac distribution function
with proper numerical stability across all temperature regimes.

Run with: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import numpy as np
from typing import List

from physics import (
    fermi_dirac,
    fermi_dirac_derivative,
    maxwell_boltzmann,
    thermal_smearing_width,
    generate_energy_grid,
    compute_2d_surface,
    K_BOLTZMANN_EV,
    PhysicalConstants
)
from models import (
    FermiDiracRequest,
    FermiDiracResponse,
    MultiTemperatureRequest,
    MultiTemperatureResponse,
    MultiTemperatureCurve,
    SurfaceRequest,
    SurfaceResponse,
    ZeroTemperatureResponse,
    PhysicsInfoResponse
)

# ============== App Configuration ==============

app = FastAPI(
    title="Fermi-Dirac Distribution API",
    description="""
    Research-grade API for computing the Fermi-Dirac distribution function.
    
    ## Features
    - Numerically stable computation across all temperature regimes
    - T → 0 limit with exact step function
    - Multi-temperature overlay support
    - 2D surface generation for heatmaps
    - Maxwell-Boltzmann comparison
    
    ## Physics
    The Fermi-Dirac distribution describes the average occupation of a 
    single-particle state with energy E at thermal equilibrium:
    
    f(E, T) = 1 / (exp((E - μ)/(kT)) + 1)
    
    where μ is the chemical potential and k is Boltzmann's constant.
    """,
    version="1.0.0",
    contact={
        "name": "Computational Physics Lab",
        "email": "physics@lab.edu"
    }
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== API Endpoints ==============

@app.get("/", tags=["Info"])
async def root():
    """API health check and welcome message."""
    return {
        "message": "Fermi-Dirac Distribution API",
        "version": "1.0.0",
        "endpoints": [
            "/fermi-dirac",
            "/multi-temperature", 
            "/zero-temperature",
            "/surface",
            "/physics-info"
        ]
    }


@app.post("/fermi-dirac", response_model=FermiDiracResponse, tags=["Computation"])
async def compute_fermi_dirac(request: FermiDiracRequest):
    """
    Compute the Fermi-Dirac distribution for a single temperature.
    
    Returns the occupation probability f(E) as a function of energy E
    for the specified temperature and chemical potential.
    
    - **temperature**: Temperature in Kelvin (use 0 for T→0 limit)
    - **mu**: Chemical potential / Fermi level in eV
    - **energy_min/max**: Energy range in eV
    - **points**: Number of energy grid points
    """
    try:
        # Generate energy grid
        energy = generate_energy_grid(
            request.energy_min,
            request.energy_max,
            request.points
        )
        
        # Compute distribution
        occupation = fermi_dirac(energy, request.temperature, request.mu)
        
        # Calculate thermal width
        width = thermal_smearing_width(request.temperature)
        
        return FermiDiracResponse(
            energy=energy.tolist(),
            occupation=occupation.tolist(),
            temperature=request.temperature,
            mu=request.mu,
            thermal_width=round(width, 6)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {str(e)}")


@app.post("/multi-temperature", response_model=MultiTemperatureResponse, tags=["Computation"])
async def compute_multi_temperature(request: MultiTemperatureRequest):
    """
    Compute Fermi-Dirac distribution for multiple temperatures.
    
    Returns multiple curves suitable for overlay plotting.
    Optionally includes Maxwell-Boltzmann comparison curves.
    """
    try:
        # Generate energy grid
        energy = generate_energy_grid(
            request.energy_min,
            request.energy_max,
            request.points
        )
        
        curves = []
        for T in request.temperatures:
            occupation = fermi_dirac(energy, T, request.mu)
            
            curve = MultiTemperatureCurve(
                temperature=T,
                occupation=occupation.tolist()
            )
            
            # Add Maxwell-Boltzmann if requested
            if request.include_maxwell_boltzmann and T > 0:
                mb = maxwell_boltzmann(energy, T, request.mu)
                curve.maxwell_boltzmann = mb.tolist()
            
            curves.append(curve)
        
        return MultiTemperatureResponse(
            energy=energy.tolist(),
            curves=curves,
            mu=request.mu
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {str(e)}")


@app.get("/zero-temperature", response_model=ZeroTemperatureResponse, tags=["Computation"])
async def compute_zero_temperature(
    mu: float = 0.5,
    energy_min: float = -1.0,
    energy_max: float = 2.0,
    points: int = 500
):
    """
    Compute the ideal T=0 Heaviside step function.
    
    At absolute zero, the Fermi-Dirac distribution becomes a perfect
    step function due to the Pauli exclusion principle: all states
    below the Fermi level are occupied, none above.
    """
    try:
        energy = generate_energy_grid(energy_min, energy_max, points)
        occupation = fermi_dirac(energy, temperature=0, mu=mu)
        
        return ZeroTemperatureResponse(
            energy=energy.tolist(),
            occupation=occupation.tolist(),
            mu=mu
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {str(e)}")


@app.post("/surface", response_model=SurfaceResponse, tags=["Computation"])
async def compute_surface(request: SurfaceRequest):
    """
    Compute 2D surface f(E, T) for heatmap visualization.
    
    Returns a 2D array suitable for rendering as a heatmap or 3D surface.
    Temperature axis can be linear or logarithmic.
    """
    try:
        # Generate energy grid
        energy = generate_energy_grid(
            request.energy_min,
            request.energy_max,
            request.energy_points
        )
        
        # Generate temperature grid
        if request.temp_scale == "log":
            temperatures = np.logspace(
                np.log10(max(request.temp_min, 0.1)),
                np.log10(request.temp_max),
                request.temp_points
            )
        else:
            temperatures = np.linspace(
                request.temp_min,
                request.temp_max,
                request.temp_points
            )
        
        # Compute 2D surface
        occupation_2d = compute_2d_surface(energy, temperatures, request.mu)
        
        return SurfaceResponse(
            energy=energy.tolist(),
            temperatures=temperatures.tolist(),
            occupation=occupation_2d.tolist(),
            mu=request.mu
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {str(e)}")


@app.get("/derivative", tags=["Computation"])
async def compute_derivative(
    temperature: float = 300.0,
    mu: float = 0.5,
    energy_min: float = -1.0,
    energy_max: float = 2.0,
    points: int = 500
):
    """
    Compute the derivative df/dE of the Fermi-Dirac distribution.
    
    The derivative is peaked at E = μ and is useful for understanding
    thermal broadening and calculating transport properties.
    """
    try:
        energy = generate_energy_grid(energy_min, energy_max, points)
        derivative = fermi_dirac_derivative(energy, temperature, mu)
        
        return {
            "energy": energy.tolist(),
            "derivative": derivative.tolist(),
            "temperature": temperature,
            "mu": mu,
            "peak_width": f"~{4 * K_BOLTZMANN_EV * temperature:.4f} eV"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {str(e)}")


@app.get("/physics-info", response_model=PhysicsInfoResponse, tags=["Info"])
async def get_physics_info():
    """
    Get physical constants and equation information.
    """
    constants = PhysicalConstants()
    
    return PhysicsInfoResponse(
        k_B_eV=constants.k_B,
        k_B_SI=constants.k_B_SI,
        equation=r"f(E, T) = \frac{1}{e^{(E - \mu)/(k_B T)} + 1}",
        regimes={
            "degenerate": {
                "condition": "T << T_F (Fermi temperature)",
                "description": "Quantum regime with sharp Fermi surface",
                "applications": ["metals at room temperature", "white dwarfs"]
            },
            "classical": {
                "condition": "T >> T_F",
                "description": "Approaches Maxwell-Boltzmann distribution",
                "applications": ["semiconductors with low doping", "hot plasmas"]
            },
            "intermediate": {
                "condition": "T ~ T_F",
                "description": "Full quantum statistics required",
                "applications": ["semiconductor devices", "neutron stars"]
            }
        }
    )


@app.get("/export/csv", tags=["Export"])
async def export_csv(
    temperature: float = 300.0,
    mu: float = 0.5,
    energy_min: float = -1.0,
    energy_max: float = 2.0,
    points: int = 500
):
    """
    Export Fermi-Dirac data as CSV format.
    """
    energy = generate_energy_grid(energy_min, energy_max, points)
    occupation = fermi_dirac(energy, temperature, mu)
    
    # Build CSV content
    csv_lines = ["Energy (eV),Occupation f(E),Temperature (K),Mu (eV)"]
    for e, f in zip(energy, occupation):
        csv_lines.append(f"{e:.6f},{f:.6f},{temperature},{mu}")
    
    csv_content = "\n".join(csv_lines)
    
    return JSONResponse(
        content={"csv": csv_content, "filename": f"fermi_dirac_T{temperature}K.csv"},
        headers={"Content-Type": "application/json"}
    )


# ============== Run Server ==============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
