import React, { useCallback, useEffect, useState } from "react";
import Calendar, { Skeleton } from "react-activity-calendar";
import dataJson from "./data.json";
import axios from "axios";

const fetchCalendarData = async (username) => {
  try {
    const currentDateNow = new Date(Date.now());
    const currentDate = currentDateNow.getDate();
    const currentMonth = currentDateNow.getMonth();
    const currentYear = currentDateNow.getFullYear();

    const dataGetUserId = await axios.get(
      `https://gitlab.com/api/v4/users?username=${username}`,
      {
        headers: {
          "PRIVATE-TOKEN": "glpat-BthcoCSKk7VLyByVLdZQ",
        },
      }
    );
    const response = await axios.get(
      `https://gitlab.com/api/v4/users/${
        dataGetUserId?.data?.[0]?.id
      }/events?after=${
        currentYear - 1 + "-" + currentMonth + "-" + currentDate
      }&per_page=2000&page=1&sort=asc`,
      {
        headers: {
          "PRIVATE-TOKEN": "glpat-BthcoCSKk7VLyByVLdZQ",
        },
      }
    );
    return response.data;
  } catch (e) {
    throw Error(
      `Fetching GitHub contribution data for "${username}" failed: ${e}`
    );
  }
};
const result = Object.keys(dataJson).map((key) => [key, dataJson[key]]);

// GitHub theme
export const DEFAULT_THEME = {
  light: ["#c084f51a", "#c084f599", "#c084f599", "#c084f5c2", "#c084f5eb"],
  dark: ["#c084f51a", "#c084f599", "#c084f599", "#c084f5c2", "#c084f5eb"],
};

const GitLabCalendar = ({
  username,
  labels,
  transformTotalCount = true,
  throwOnError = false,
  errorMessage = `Error – Fetching Gitlab contribution data for "${username}" failed.`,
  ...props
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchCalendarData(username)
      .then(setData(result))
      .catch(setError)
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(fetchData, [fetchData]);

  //   React error boundaries can't handle asynchronous code, so rethrow.
  if (error) {
    if (throwOnError) {
      throw error;
    } else {
      return <div>{errorMessage}</div>;
    }
  }

  if (loading || !data) {
    return <Skeleton {...props} loading />;
  }

  const theme = props.theme ?? DEFAULT_THEME;

  const defaultLabels = {
    totalCount: `{{count}} contributions in ${
      "last" === "last" ? "the last year" : "{{year}}"
    }`,
  };

  const totalCount = data.reduce((currentValue, currentData) => {
    return currentValue + currentData[1];
  }, 0);
  let maxNumberCommit = 1;
  const markRawData = data.map((currentData) => {
    if (currentData[1] >= maxNumberCommit) {
      maxNumberCommit = currentData[1];
    }
    return {
      date: currentData[0],
      count: currentData[1],
    };
  });
  const markData = markRawData.map((currentData) => {
    return {
      ...currentData,
      level: ((currentData.count * 4) / maxNumberCommit).toFixed(0),
    };
  });

  return (
    <Calendar
      data={markData}
      labels={Object.assign({}, defaultLabels, labels)}
      totalCount={totalCount}
      {...props}
      maxLevel={4}
    />
  );
};

export default GitLabCalendar;
