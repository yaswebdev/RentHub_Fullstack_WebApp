import * as React from 'react';
import { Button } from './Button';
import { AlertCircle } from 'lucide-react';

/** Attrape les erreurs React inattendues et affiche un écran d'erreur. */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { aErreur: false, erreur: null };
  }

  static getDerivedStateFromError(erreur) {
    return { aErreur: true, erreur };
  }

  componentDidCatch(erreur, info) {
    console.error('[ErrorBoundary] Erreur non gérée :', erreur, info);
  }

  render() {
    if (this.state.aErreur) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
            <div className="bg-red-50 p-3 rounded-full w-fit mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-display font-bold text-slate-900 mb-4">
              Une erreur est survenue
            </h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Une erreur inattendue s'est produite. Veuillez rafraîchir la page.
            </p>
            <div className="bg-slate-50 p-4 rounded-xl mb-8 text-left overflow-auto max-h-32">
              <code className="text-xs text-slate-600 font-mono">
                {this.state.erreur?.message || 'Erreur inconnue'}
              </code>
            </div>
            <Button
              variant="primary"
              className="w-full rounded-xl"
              onClick={() => window.location.reload()}
            >
              Rafraîchir la page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
