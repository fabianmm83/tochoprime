import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, type Role } from '../services/firebase';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  phone?: string; // Teléfono opcional
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  registerWithEmail: (
    email: string, 
    password: string, 
    displayName: string, 
    role: Role,
    phone?: string // Teléfono como parámetro opcional
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            setUserData(data);
            
            // Verificar si el usuario está activo
            if (!data.isActive) {
              await logout();
              alert('Tu cuenta está desactivada. Contacta al administrador.');
            }
          }
        } catch (error) {
          console.error('Error cargando datos del usuario:', error);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    if (!userDoc.exists()) {
      throw new Error('Usuario no registrado en el sistema');
    }
    
    const data = userDoc.data() as UserData;
    if (!data.isActive) {
      await signOut(auth);
      throw new Error('Cuenta desactivada');
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    // Verificar si el usuario ya existe en Firestore
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    if (!userDoc.exists()) {
      // Crear perfil por primera vez
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || userCredential.user.email?.split('@')[0],
        role: 'espectador' as Role,
        phone: '', // Teléfono vacío por defecto
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  };

  const registerWithEmail = async (
    email: string, 
    password: string, 
    displayName: string, 
    role: Role,
    phone?: string // Teléfono opcional
  ) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email,
      displayName,
      role,
      phone: phone || '', // Guardar teléfono si se proporciona
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateUserData = async (data: Partial<UserData>) => {
    if (!user) throw new Error('No hay usuario autenticado');
    
    await setDoc(doc(db, 'users', user.uid), {
      ...data,
      updatedAt: new Date()
    }, { merge: true });
    
    // Actualizar estado local
    setUserData(prev => prev ? { ...prev, ...data } : null);
  };

  const value: AuthContextType = {
    user,
    userData,
    loading,
    loginWithEmail,
    loginWithGoogle,
    registerWithEmail,
    logout,
    updateUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};