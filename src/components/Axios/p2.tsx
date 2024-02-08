/* eslint-disable multiline-ternary */
import React, { useCallback, useRef, useState } from "react";
import dummyApi from "./dummyApi/dummyApi";

function Axios() {
  const [products, setProducts] = useState<any[]>([]);

  const newProductRef = useRef<HTMLInputElement | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);

  const createProduct = useCallback(() => {
    const title = newProductRef.current?.value;

    if (title == null) return;

    void (async () => {
      if (newProductRef.current == null || newProductRef.current.value === "") {
        alert("no title provided!");

        return;
      }
      setAddingProduct(true);

      newProductRef.current.value = "";

      await dummyApi
        .post("/products/add", { title })
        .then((res) => {
          setProducts((prev) => [
            ...prev,
            { ...res.data, id: prev.length + 1 },
          ]);
        })
        .catch((err) => {
          console.log("error in here", err);
        });

      setAddingProduct(false);
    })();
  }, []);

  return (
    <div>
      <h1>axios</h1>

      {products.length === 0 ? (
        <h2>No products found (add some!)</h2>
      ) : (
        <ul
          style={{
            maxHeight: "500px",
            overflow: "auto",
          }}
        >
          {products.map((product) => (
            <Product setProducts={setProducts} {...product} key={product.id} />
          ))}
        </ul>
      )}

      <input placeholder="title" ref={newProductRef} />
      <button disabled={addingProduct} onClick={createProduct}>
        {addingProduct ? "wait..." : "create product"}
      </button>
    </div>
  );
}

export default Axios;

const Product = ({
  id,
  title,
  setProducts,
}: {
  id: number;
  title: string;
  setProducts: React.Dispatch<React.SetStateAction<any[]>>;
}) => {
  const [loaders, setLoaders] = useState({
    editing: false,
    deleting: false,
    updating: false,
  });

  const editRef = useRef<HTMLInputElement>(null);

  const editProduct = useCallback(() => {
    setLoaders((prev) => ({ ...prev, editing: !prev.editing }));
  }, []);

  const updateProduct = useCallback(() => {
    void (async () => {
      // setEditing(false);
      if (editRef.current == null || editRef.current.value === "") {
        alert("no title provided!");
        return;
      }

      setLoaders((prev) => ({ ...prev, updating: true }));

      void (await dummyApi
        .put("/products/1", { title: editRef.current.value })
        .then((res) => {
          if (res.data != null) {
            console.log("updated", res.data);
            setProducts((prev) =>
              prev.map((p) => (p.id === id ? { ...res.data, id } : p))
            );
          }
        })
        .catch((err) => {
          console.log("error in here", err);
          alert("Something went wrong!");
        }));

      setLoaders((prev) => ({ ...prev, updating: false, editing: false }));
    })();
  }, [id, setProducts]);

  const deleteProduct = useCallback(() => {
    void (async () => {
      setLoaders((prev) => ({ ...prev, deleting: true }));

      void (await dummyApi
        .delete(`/products/${id}`)
        .then(() => {
          setProducts((prev) => prev.filter((p) => p.id !== id));
        })
        .catch((err) => {
          console.log("error in here", err);
          alert("Something went wrong!");
        }));

      setLoaders((prev) => ({ ...prev, deleting: false }));
    })();
  }, [id, setProducts]);

  return (
    <li
      style={{
        border: "1px solid black",
        padding: "10px",
        margin: "10px",
      }}
    >
      <h2>{loaders.editing ? `Editing the product #${id}` : "Product"}</h2>

      {loaders.editing ? (
        <div>
          <input ref={editRef} defaultValue={title} placeholder="new title" />
          <button disabled={loaders.updating} onClick={updateProduct}>
            {loaders.updating ? "updating..." : "update"}
          </button>
          <button
            onClick={() => {
              setLoaders((prev) => ({ ...prev, editing: false }));
            }}
          >
            cancel
          </button>
        </div>
      ) : (
        <>
          <h3>
            #{id} {title}
          </h3>
          <button onClick={editProduct}>edit</button>
          <button disabled={loaders.deleting} onClick={deleteProduct}>
            {
              loaders.deleting ? "deleting..." : "delete"
            }
          </button>
        </>
      )}
    </li>
  );
};
