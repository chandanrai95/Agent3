import Content from "./content"
import Footer from "./footer"
import Header from "./header"

const Sidebar = () => {
  return (
    <>
      <input
        type="checkbox"
        id="input-sidebar-toggle"
        className="peer hidden"
      />
      <aside
        className="
        sidebar-container
        bg-sidebar
        flex-col
        w-[350px]
        max-w-[80vw]
        h-screen
        border-white
        peer-checked:translate-x-[100%]
        shadow-xl
        z-10
      "
      >
        <Header />
        <Content />
        <Footer/>
      </aside>
      <label
        htmlFor="input-sidebar-toggle"
        className="
          fixed inset-0 bg-black/40
          opacity-0 pointer-events-none
          transition
          peer-checked:opacity-100
          peer-checked:pointer-events-auto
          md:hidden
          z-9
        "
      />
    </>
  )
}

export default Sidebar