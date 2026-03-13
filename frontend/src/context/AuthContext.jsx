import { createContext,useState,useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({children}) => {

  const [user,setUser] = useState(null);

  useEffect(()=>{

    const token = localStorage.getItem("token");

    if(token){

      fetch("https://purveyols-api.onrender.com/api/auth/me",{

        headers:{
          Authorization:`Bearer ${token}`
        }

      })
      .then(res=>res.json())
      .then(data=>{
        if(data.user){
          setUser(data.user);
        }
      })
      .catch(()=>{});

    }

  },[]);

  return(

    <AuthContext.Provider value={{user,setUser}}>

      {children}

    </AuthContext.Provider>

  );

};