exports.getBrawtStarsUserInfoByTag = async (tag) => {
  const res = await fetch(
    `${process.env.BRAWL_STARS_API_BASE_URL}/profile/${tag}`
  );

  let data;

  if (res.headers.get("content-type").includes("application/json"))
    data = await res.json();
  if (res.headers.get("content-type").includes("text")) data = await res.text();

  if (!res.ok) {
    console.log(res);

    console.log(data);
    if (res.status === 429)
      throw new Error("Too many requests, please try in a minute");

    throw new Error("Something went wrong while fetching user info");
  }

  if (data.state === 1){
    console.log(res)
    console.log(data)
    throw new Error("Please double check if the tag is correct!");
  }

  if (!data.response){
    console.log(res)
    console.log(data)
    throw new Error("Please double check if the tag is correct!");
  }

  return data;
};
