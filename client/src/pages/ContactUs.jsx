import { backendUrl } from "../config";
import NavigationButtons from "../components/NavigationButtons";

// ... existing code ...
const response = await axios.post(`${backendUrl}/contact`, formData, {
  headers: {
    "Content-Type": "application/json",
  },
});
// ... existing code ...

<NavigationButtons />;
