/* eslint-disable multiline-ternary */
import React, { useCallback, useRef, useState } from "react";
import dummyApi from "./dummyApi/dummyApi";

function Axios() {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [searching, setSearching] = useState<boolean>(false);

  const abortingRef = useRef<AbortController | null>(null);

  const [products, setProducts] = useState<any[]>([]);

  const callApi = useCallback(() => {
    void (async () => {
      const search = searchRef.current?.value;

      if (abortingRef.current != null) {
        abortingRef.current.abort();
      }

      abortingRef.current = new AbortController();
      setSearching(true);

      await dummyApi
        .get("/products/search", {
          params: { q: search },
          signal: abortingRef.current.signal,
        })
        .then((res) => {
          setProducts(res.data.products);
        })
        .catch((err) => {
          console.log("error in here", err);
        })
        .finally(() => {});

      abortingRef.current = null;
      setSearching(false);
    })();
  }, []);

  const newProductRef = useRef<HTMLInputElement | null>(null);

  const createProduct = useCallback(() => {
    const title = newProductRef.current?.value;

    void (async () => {
      await dummyApi
        .post("/products/add", { title })
        .then((res) => {
          setProducts((prev) => [...prev, res.data]);
        })
        .catch((err) => {
          console.log("error in here", err);
        });
    })();
  }, []);

  return (
    <div>
      <h1>axios</h1>
      <input ref={searchRef} type="text" />
      <button disabled={searching} onClick={callApi}>
        {searching ? "we are searching" : "search"}
      </button>

      {products.length === 0 ? (
        <h2>No products found (try searching or add it!)</h2>
      ) : (
        <ul
          style={{
            maxHeight: "500px",
            overflow: "auto",
          }}
        >
          {products.map((product) => (
            <li key={product.id}>
              <h3>{product.title}</h3>
              <div>
                <Images images={product.images} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <input placeholder="title" ref={newProductRef} />
      <button onClick={createProduct}>create product</button>
    </div>
  );
}

export default Axios;

const Images = ({ images }: { images?: string[] }) => {
  if (images == null) {
    return null;
  }

  return (
    <div>
      {images.map((image, i) => (
        <img key={i} src={image} alt="" />
      ))}
    </div>
  );
};
