exports.getBrawtStarsUserInfoByTag = async (tag) => {
  const res = await fetch(
    `${process.env.BRAWL_STARS_API_BASE_URL}/profile?tag=${tag}`
  );

  let data;

  if (res.headers.get("content-type").includes("application/json"))
    data = await res.json();
  if (res.headers.get("content-type").includes("text")) data = await res.text();

  if (!res.ok) {
    //other than 2xx
    console.log(res);

    console.log(data);
    if (res.status === 429)
      throw new Error("Too many requests, please try in a minute");

    throw new Error("Something went wrong while fetching user info");
  }

  if (!data.ok) {
    // when json.ok = false
    console.log(res);
    console.log(data);
    throw new Error("Please double check if the tag is correct!");
  }

  if (typeof data.result !== "object") {
    console.log(res);
    console.log(data);
    throw new Error("Please double check if the tag is correct!");
  }

  return data;
};
