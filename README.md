# Fermi–Dirac Distribution Interactive Simulation

A research-grade, interactive web application for visualizing the Fermi–Dirac distribution function across temperatures. Built for physicists, engineers, and students studying quantum statistics and condensed matter physics.

![Fermi-Dirac Visualization](https://img.shields.io/badge/Physics-Quantum%20Statistics-00f5ff)
![Python](https://img.shields.io/badge/Backend-FastAPI-009688)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20D3.js-61dafb)

## 🎯 Overview

The Fermi–Dirac distribution describes the statistical behavior of fermions (particles with half-integer spin) at thermal equilibrium:

$$
f(E, T) = \frac{1}{e^{(E - \mu)/(k_B T)} + 1}
$$

where:
- **E**: Energy (eV)
- **T**: Temperature (Kelvin)
- **μ**: Chemical potential / Fermi level (eV)
- **k_B**: Boltzmann constant (8.617333262 × 10⁻⁵ eV/K)

This simulation provides real-time visualization of how the distribution evolves from a sharp step function at T = 0 K to a smooth, thermally-broadened curve at finite temperatures.

## ✨ Features

### Core Visualization
- **Multi-temperature overlay**: Compare distributions at different temperatures simultaneously
- **T → 0 limit**: Perfect Heaviside step function (Pauli exclusion at ground state)
- **Maxwell–Boltzmann comparison**: Visualize the classical limit
- **Interactive tooltips**: Precise E, f(E), and T values on hover

### Advanced Visualization (Mandatory Feature)
- **Energy–Temperature Heatmap**: 2D surface plot of f(E, T) showing the complete parameter space
- **Canvas-based rendering**: Efficient visualization of 20,000+ data points
- **Logarithmic temperature scale**: Spanning 1 K to 10,000 K

### User Interface
- **Dark mode aesthetic**: Midnight blue background with neon accent colors
- **Glassmorphism panels**: Modern, physics-lab appearance
- **Logarithmic temperature slider**: Intuitive control across 4+ orders of magnitude
- **Mode switching**: Conceptual (educational) vs Research (numerical) modes
- **CSV export**: Download energy–occupation data for external analysis

### Educational Content
- **Collapsible physics panel**: Explains thermal smearing, chemical potential, Pauli exclusion
- **Physical regime indicators**: Degenerate, intermediate, and classical limits
- **Application examples**: Metals, semiconductors, astrophysics, nuclear physics

## 🏗️ Architecture

```
fermi-dirac/
├── backend/                    # FastAPI Python backend
│   ├── main.py                # API server & endpoints
│   ├── physics.py             # Fermi-Dirac computations
│   ├── models.py              # Pydantic request/response models
│   └── requirements.txt       # Python dependencies
│
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx            # Main application component
│   │   ├── components/
│   │   │   ├── FermiDiracChart.tsx   # D3.js curve visualization
│   │   │   ├── Heatmap.tsx           # Canvas-based E-T surface
│   │   │   ├── ControlPanel.tsx      # Parameter controls
│   │   │   └── EducationalPanel.tsx  # Physics explanations
│   │   ├── services/
│   │   │   └── api.ts         # Backend API client
│   │   └── types/
│   │       └── api.ts         # TypeScript interfaces
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- **Python 3.9+** with pip
- **Node.js 18+** with npm

### Backend Setup

```bash
# Navigate to backend directory
cd fermi-dirac/backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
.\venv\Scripts\Activate    # Windows

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Visit `/docs` for interactive Swagger documentation.

### Frontend Setup

```bash
# Navigate to frontend directory
cd fermi-dirac/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will open at `http://localhost:3000`.

### Production Build

```bash
# Build optimized frontend
cd frontend
npm run build

# Serve with any static server
npx serve dist
```

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/fermi-dirac` | POST | Single temperature distribution |
| `/multi-temperature` | POST | Multiple temperature curves (overlay) |
| `/zero-temperature` | GET | T=0 Heaviside step function |
| `/surface` | POST | 2D f(E,T) data for heatmap |
| `/derivative` | GET | df/dE derivative function |
| `/physics-info` | GET | Physical constants & regime info |
| `/export/csv` | GET | Download data as CSV |

### Example Request

```bash
curl -X POST "http://localhost:8000/fermi-dirac" \
  -H "Content-Type: application/json" \
  -d '{
    "temperature": 300,
    "mu": 0.5,
    "energy_min": -1,
    "energy_max": 2,
    "points": 500
  }'
```

## 🔬 Physics Implementation

### Numerical Stability

The implementation handles edge cases that can cause numerical overflow:

1. **T → 0 limit**: Returns exact step function instead of computing exp(±∞)
2. **Large exponents**: For |(E-μ)/kT| > 700, uses asymptotic approximations:
   - E >> μ: f(E) ≈ exp(-(E-μ)/kT)
   - E << μ: f(E) ≈ 1

### Physical Constants

```python
k_B = 8.617333262e-5  # eV/K (Boltzmann constant)
```

### Key Physical Regimes

| Regime | Condition | Behavior |
|--------|-----------|----------|
| **Degenerate** | T << T_F | Sharp Fermi surface, quantum effects dominate |
| **Intermediate** | T ~ T_F | Full F-D statistics required |
| **Classical** | T >> T_F | Approaches Maxwell-Boltzmann distribution |

The Fermi temperature T_F is related to the Fermi energy by: T_F = E_F / k_B

## 🎨 Visual Design

### Color Palette

| Element | Color | Hex |
|---------|-------|-----|
| Primary (cold) | Cyan | `#00f5ff` |
| Secondary | Violet | `#a855f7` |
| Accent (hot) | Amber | `#fbbf24` |
| Background | Midnight | `#0a0a0f` |

### Curve Colors (by temperature)
- `#00f5ff` - 0 K (cyan)
- `#3b82f6` - Low T (blue)
- `#a855f7` - Medium T (violet)
- `#f43f5e` - Higher T (rose)
- `#fbbf24` - High T (amber)

## 🧪 Use Cases

### For Physicists
- Visualize thermal broadening of the Fermi surface
- Compare quantum vs classical statistics
- Generate publication-quality figures (CSV export)

### For Engineers
- Understand carrier distributions in semiconductors
- Model thermoelectric effects
- Design electronic devices

### For Students
- Interactive learning of quantum statistics
- Explore parameter space intuitively
- Connect equations to visual behavior

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:8000
```

### Customization

- **Energy range**: -10 to +10 eV (adjustable in UI)
- **Temperature range**: 0 to 10,000 K
- **Grid points**: Up to 10,000 for high-resolution plots

## 📚 Further Reading

- Ashcroft & Mermin, "Solid State Physics" - Chapter 2
- Kittel, "Introduction to Solid State Physics" - Chapter 6
- Landau & Lifshitz, "Statistical Physics" - §55-57

## 📄 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

---

*Built with ❤️ for the physics community*
