"""
Fermi-Dirac Distribution Physics Module

This module implements the Fermi-Dirac distribution function with proper
numerical stability handling for extreme temperature regimes.

The Fermi-Dirac distribution describes the probability that a fermion
occupies a quantum state with energy E at thermal equilibrium:

    f(E, T) = 1 / (exp((E - μ) / (k_B * T)) + 1)

Author: Computational Physics Lab
License: MIT
"""

import numpy as np
from typing import Tuple, List, Optional
from dataclasses import dataclass

# Physical Constants (SI units converted to eV/K for convenience)
K_BOLTZMANN_EV = 8.617333262e-5  # Boltzmann constant in eV/K


@dataclass
class PhysicalConstants:
    """Container for fundamental physical constants."""
    k_B: float = K_BOLTZMANN_EV  # Boltzmann constant (eV/K)
    
    @property
    def k_B_SI(self) -> float:
        """Boltzmann constant in SI units (J/K)."""
        return 1.380649e-23


def fermi_dirac(
    energy: np.ndarray,
    temperature: float,
    mu: float,
    k_B: float = K_BOLTZMANN_EV
) -> np.ndarray:
    """
    Compute the Fermi-Dirac distribution function.
    
    The distribution gives the occupation probability for fermions at
    thermal equilibrium following Pauli exclusion principle.
    
    Parameters
    ----------
    energy : np.ndarray
        Array of energy values (eV)
    temperature : float
        Temperature (Kelvin). Must be non-negative.
    mu : float
        Chemical potential / Fermi level (eV)
    k_B : float, optional
        Boltzmann constant in eV/K (default: 8.617333262e-5)
    
    Returns
    -------
    np.ndarray
        Occupation probability f(E) for each energy value
    
    Notes
    -----
    Numerical stability is achieved by:
    1. At T → 0: Return exact Heaviside step function
    2. For large (E-μ)/kT: Use asymptotic expansion to avoid overflow
    3. For small (E-μ)/kT: Standard computation is stable
    
    Physical regimes:
    - T << T_F (Fermi temp): Degenerate quantum regime, step-like
    - T >> T_F: Classical regime, approaches Maxwell-Boltzmann
    """
    energy = np.asarray(energy, dtype=np.float64)
    
    # Handle T = 0 case: Perfect step function (Pauli exclusion at ground state)
    if temperature <= 0 or np.isclose(temperature, 0, atol=1e-10):
        return np.where(energy < mu, 1.0, np.where(energy > mu, 0.0, 0.5))
    
    # Compute the exponent argument: (E - μ) / (k_B * T)
    k_B_T = k_B * temperature
    x = (energy - mu) / k_B_T
    
    # Initialize output array
    occupation = np.zeros_like(energy)
    
    # Numerical stability thresholds
    # For x >> 1: f(E) ≈ exp(-x) (classical tail)
    # For x << -1: f(E) ≈ 1 - exp(x) ≈ 1
    OVERFLOW_THRESHOLD = 700  # exp(700) ~ 10^304, near float64 max
    
    # Region 1: x is very negative (E << μ), occupation ≈ 1
    mask_low = x < -OVERFLOW_THRESHOLD
    occupation[mask_low] = 1.0
    
    # Region 2: x is very positive (E >> μ), occupation ≈ exp(-x)
    mask_high = x > OVERFLOW_THRESHOLD
    occupation[mask_high] = np.exp(-x[mask_high])
    
    # Region 3: Moderate x, use standard formula
    mask_mid = ~(mask_low | mask_high)
    occupation[mask_mid] = 1.0 / (np.exp(x[mask_mid]) + 1.0)
    
    return occupation


def fermi_dirac_derivative(
    energy: np.ndarray,
    temperature: float,
    mu: float,
    k_B: float = K_BOLTZMANN_EV
) -> np.ndarray:
    """
    Compute the derivative of the Fermi-Dirac distribution: df/dE.
    
    This is important for calculating:
    - Density of states weighted properties
    - Thermal broadening effects
    - Sommerfeld expansion terms
    
    Parameters
    ----------
    energy : np.ndarray
        Array of energy values (eV)
    temperature : float
        Temperature (Kelvin)
    mu : float
        Chemical potential (eV)
    k_B : float, optional
        Boltzmann constant in eV/K
    
    Returns
    -------
    np.ndarray
        df/dE for each energy value
        
    Notes
    -----
    The derivative is a peaked function centered at E = μ with width ~ k_B*T.
    At T → 0, it becomes a Dirac delta function: δ(E - μ).
    
    df/dE = -1/(k_B*T) * exp(x) / (exp(x) + 1)^2 = -1/(4*k_B*T) * sech^2(x/2)
    """
    if temperature <= 0:
        # At T=0, derivative is a delta function (represented as zero array with spike)
        result = np.zeros_like(energy)
        # Find closest point to mu and set a large value
        idx = np.argmin(np.abs(energy - mu))
        if len(energy) > 1:
            dE = np.abs(energy[1] - energy[0]) if len(energy) > 1 else 1e-6
            result[idx] = -1.0 / dE  # Approximate delta function
        return result
    
    k_B_T = k_B * temperature
    x = (energy - mu) / k_B_T
    
    # Use sech^2 form for numerical stability
    # df/dE = -1/(4*k_B*T) * sech^2(x/2)
    # sech(x/2) = 2 / (exp(x/2) + exp(-x/2))
    
    result = np.zeros_like(energy)
    
    # For moderate x values
    mask_stable = np.abs(x) < 500
    exp_half = np.exp(x[mask_stable] / 2)
    sech_squared = (2.0 / (exp_half + 1.0/exp_half)) ** 2
    result[mask_stable] = -sech_squared / (4.0 * k_B_T)
    
    # For extreme x values, derivative is essentially zero
    return result


def maxwell_boltzmann(
    energy: np.ndarray,
    temperature: float,
    mu: float,
    k_B: float = K_BOLTZMANN_EV
) -> np.ndarray:
    """
    Compute the classical Maxwell-Boltzmann distribution.
    
    This is the high-temperature (classical) limit of the Fermi-Dirac
    distribution, valid when exp((E-μ)/(k_B*T)) >> 1.
    
    f_MB(E) = exp(-(E - μ) / (k_B * T))
    
    Parameters
    ----------
    energy : np.ndarray
        Array of energy values (eV)
    temperature : float
        Temperature (Kelvin)
    mu : float
        Chemical potential (eV)
    k_B : float, optional
        Boltzmann constant in eV/K
    
    Returns
    -------
    np.ndarray
        Classical occupation probability (not normalized)
    """
    if temperature <= 0:
        return np.zeros_like(energy)
    
    x = (energy - mu) / (k_B * temperature)
    
    # Clip to avoid overflow
    x_clipped = np.clip(x, -700, 700)
    return np.exp(-x_clipped)


def compute_fermi_energy(
    n_electrons: float,
    dos_prefactor: float = 1.0,
    dimension: int = 3
) -> float:
    """
    Compute the Fermi energy for a free electron gas at T=0.
    
    For a 3D free electron gas:
    E_F = (ℏ²/2m) * (3π²n)^(2/3)
    
    Parameters
    ----------
    n_electrons : float
        Electron density (per unit volume)
    dos_prefactor : float, optional
        Density of states prefactor (default: 1.0)
    dimension : int, optional
        Dimensionality (2 or 3)
    
    Returns
    -------
    float
        Fermi energy in appropriate units
    """
    if dimension == 3:
        return dos_prefactor * (n_electrons ** (2.0/3.0))
    elif dimension == 2:
        return dos_prefactor * n_electrons
    else:
        raise ValueError(f"Unsupported dimension: {dimension}")


def thermal_smearing_width(
    temperature: float,
    k_B: float = K_BOLTZMANN_EV
) -> float:
    """
    Compute the characteristic thermal smearing width.
    
    The Fermi-Dirac distribution transitions from ~1 to ~0 over an
    energy range of approximately 4*k_B*T centered at μ.
    
    Parameters
    ----------
    temperature : float
        Temperature (Kelvin)
    k_B : float, optional
        Boltzmann constant in eV/K
    
    Returns
    -------
    float
        Thermal smearing width (eV)
    """
    return 4.0 * k_B * temperature


def generate_energy_grid(
    e_min: float,
    e_max: float,
    n_points: int,
    spacing: str = "linear"
) -> np.ndarray:
    """
    Generate an energy grid for calculations.
    
    Parameters
    ----------
    e_min : float
        Minimum energy (eV)
    e_max : float
        Maximum energy (eV)
    n_points : int
        Number of grid points
    spacing : str
        Grid spacing type: "linear" or "log"
    
    Returns
    -------
    np.ndarray
        Array of energy values
    """
    if spacing == "linear":
        return np.linspace(e_min, e_max, n_points)
    elif spacing == "log":
        if e_min <= 0:
            raise ValueError("Logarithmic spacing requires positive e_min")
        return np.logspace(np.log10(e_min), np.log10(e_max), n_points)
    else:
        raise ValueError(f"Unknown spacing type: {spacing}")


def compute_multi_temperature(
    energy: np.ndarray,
    temperatures: List[float],
    mu: float,
    k_B: float = K_BOLTZMANN_EV
) -> List[np.ndarray]:
    """
    Compute Fermi-Dirac distribution for multiple temperatures.
    
    Useful for overlay plots comparing thermal regimes.
    
    Parameters
    ----------
    energy : np.ndarray
        Energy grid
    temperatures : List[float]
        List of temperatures (Kelvin)
    mu : float
        Chemical potential (eV)
    k_B : float, optional
        Boltzmann constant
    
    Returns
    -------
    List[np.ndarray]
        List of occupation arrays, one per temperature
    """
    return [fermi_dirac(energy, T, mu, k_B) for T in temperatures]


def compute_2d_surface(
    energy: np.ndarray,
    temperatures: np.ndarray,
    mu: float,
    k_B: float = K_BOLTZMANN_EV
) -> np.ndarray:
    """
    Compute 2D surface f(E, T) for heatmap visualization.
    
    Parameters
    ----------
    energy : np.ndarray
        1D array of energy values
    temperatures : np.ndarray
        1D array of temperature values
    mu : float
        Chemical potential (eV)
    k_B : float, optional
        Boltzmann constant
    
    Returns
    -------
    np.ndarray
        2D array of shape (len(temperatures), len(energy))
        where result[i, j] = f(energy[j], temperatures[i])
    """
    E_grid, T_grid = np.meshgrid(energy, temperatures)
    
    result = np.zeros_like(E_grid)
    
    for i, T in enumerate(temperatures):
        result[i, :] = fermi_dirac(energy, T, mu, k_B)
    
    return result


# Unit tests for physics functions
if __name__ == "__main__":
    # Test basic functionality
    E = np.linspace(-1, 2, 100)
    
    print("Testing Fermi-Dirac at T=0...")
    f_zero = fermi_dirac(E, 0, mu=0.5)
    assert np.all(f_zero[E < 0.5] == 1.0), "T=0 should give step function"
    assert np.all(f_zero[E > 0.5] == 0.0), "T=0 should give step function"
    print("✓ T=0 test passed")
    
    print("Testing Fermi-Dirac at T=300K...")
    f_room = fermi_dirac(E, 300, mu=0.5)
    assert 0 < f_room[50] < 1, "Should have intermediate values at finite T"
    print("✓ T=300K test passed")
    
    print("Testing numerical stability at low T...")
    f_low = fermi_dirac(E, 1, mu=0.5)  # 1 Kelvin
    assert np.all(np.isfinite(f_low)), "Should not have NaN/Inf"
    print("✓ Low T stability test passed")
    
    print("Testing Maxwell-Boltzmann limit...")
    f_fd = fermi_dirac(E, 10000, mu=0.5)  # High T
    f_mb = maxwell_boltzmann(E, 10000, mu=0.5)
    # At high T and E > μ, they should be similar
    high_E_mask = E > 1.0
    ratio = f_fd[high_E_mask] / f_mb[high_E_mask]
    assert np.allclose(ratio, ratio[0], rtol=0.1), "Should approach MB at high T"
    print("✓ Maxwell-Boltzmann limit test passed")
    
    print("\nAll physics tests passed! ✓")
