
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, onValue, off } from "firebase/database";
import { FirebaseSettings } from "../types";

export function subscribeToMoisture(
  settings: FirebaseSettings,
  onUpdate: (moisture: number) => void
) {
  if (!settings.enabled || !settings.databaseURL) {
    return () => {};
  }

  const firebaseConfig = {
    apiKey: settings.apiKey,
    databaseURL: settings.databaseURL,
    projectId: settings.projectId,
  };

  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const db = getDatabase(app);
    
    /**
     * PATH ALIGNMENT: 
     * The user's ESP32 code uses: "/field1/soilMoisture"
     */
    const moisturePath = "/field1/soilMoisture";
    const moistureRef = ref(db, moisturePath);

    const unsubscribe = onValue(moistureRef, (snapshot: any) => {
      const rawValue = snapshot.val();
      if (rawValue === null) return;

      let valueAsNumber: number = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue);
      
      if (!isNaN(valueAsNumber)) {
        /**
         * CALIBRATION LOGIC:
         * minMoisture = Raw value when DRY (0%)
         * maxMoisture = Raw value when WET (100%)
         */
        const min = settings.minMoisture ?? 0;
        const max = settings.maxMoisture ?? 4095;
        
        let percentage = 0;
        if (max !== min) {
          // Standard linear mapping: (input - min) / (max - min)
          percentage = ((valueAsNumber - min) / (max - min)) * 100;
        } else {
          percentage = 0;
        }
        
        // Clamp result between 0 and 100
        const finalPercentage = Math.max(0, Math.min(100, percentage));
        
        console.log(`[Firebase Hub] Raw: ${valueAsNumber}, Mapped: ${finalPercentage.toFixed(1)}% (Range: ${min}-${max})`);
        onUpdate(finalPercentage);
      }
    });

    return () => off(moistureRef, "value", unsubscribe);
  } catch (error) {
    console.error("Firebase connection error:", error);
    return () => {};
  }
}
