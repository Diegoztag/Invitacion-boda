tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: '#EC4899',
                'on-primary': '#ffffff',
                'primary-container': '#fce7f3',
                'on-primary-container': '#9d174d',
                secondary: '#4b5563',
                'on-secondary': '#ffffff',
                surface: '#f9f9ff',
                'on-surface': '#1a1c1e',
                'surface-variant': '#e1e2ec',
                'on-surface-variant': '#44474e',
                outline: '#74777f',
                'outline-variant': '#c4c6cf',
                background: '#ffffff',
                'on-background': '#1a1c1e',
                'surface-container-lowest': '#ffffff',
                'surface-container-low': '#f0f3ff',
                'surface-container': '#f9f9ff',
                'surface-container-high': '#eef0f8',
                'surface-container-highest': '#e3e5ed'
            },
            borderRadius: {
                DEFAULT: '8px',
                lg: '12px',
                xl: '16px',
                full: '9999px'
            },
            spacing: {
                xs: '4px',
                margin: '32px',
                gutter: '24px',
                lg: '48px',
                xl: '80px',
                sm: '12px',
                base: '8px',
                md: '24px'
            },
            fontFamily: {
                serif: ['Noto Serif', 'serif'],
                sans: ['Inter', 'sans-serif'],
                h1: ['Noto Serif'],
                h2: ['Noto Serif'],
                h3: ['Noto Serif'],
                'body-md': ['Inter'],
                'label-sm': ['Inter']
            },
            fontSize: {
                h1: ['48px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
                h2: ['36px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
                h3: ['28px', { lineHeight: '1.4', letterSpacing: '0', fontWeight: '500' }],
                'body-md': ['16px', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],
                'label-sm': [
                    '12px',
                    { lineHeight: '1', letterSpacing: '0.05em', fontWeight: '600' }
                ]
            }
        }
    }
};

// Lógica de login existente (adaptada para el nuevo diseño si es necesario)
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('form');

    if (loginForm) {
        loginForm.addEventListener('submit', async e => {
            e.preventDefault();

            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const submitButton = loginForm.querySelector('button[type="submit"]');

            const email = emailInput.value;
            const password = passwordInput.value;

            if (!email || !password) {
                alert('Por favor, ingresa correo y contraseña');
                return;
            }

            try {
                // Cambiar estado del botón
                const originalText = submitButton.textContent;
                submitButton.textContent = 'Iniciando sesión...';
                submitButton.disabled = true;

                // Obtener la URL base de la API desde la configuración global
                const API_BASE_URL =
                    (window.WEDDING_CONFIG?.api?.backendUrl || 'http://localhost:3000') + '/api/v1';

                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username: email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Guardar token
                    localStorage.setItem('dashboardToken', data.token);
                    // Redirigir al dashboard
                    window.location.href = '/dashboard/index.html';
                } else {
                    alert(data.message || 'Error al iniciar sesión');
                    submitButton.textContent = originalText;
                    submitButton.disabled = false;
                }
            } catch (error) {
                console.error('Error de login:', error);
                alert('Error de conexión. Por favor, intenta de nuevo.');
                submitButton.textContent = 'Iniciar sesión';
                submitButton.disabled = false;
            }
        });
    }
});
