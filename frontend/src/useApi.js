import { useState } from "react";

const useApi = (apiURL) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (url, method = "GET", body = null) => {
    setLoading(true);

    try {
      const response = await fetch(`${apiURL}${url}`, {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : null,
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, fetchData };
};

export default useApi;
