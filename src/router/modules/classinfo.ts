const { VITE_HIDE_HOME } = import.meta.env;
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/classinfo",
  component: Layout,
  name: "classinfo",
  redirect: "/classinfo",
  meta: {
    title: "课程信息",
    icon: "material-symbols:book-ribbon-outline",
    rank: 2
  },
  children: [
    {
      path: "/classinfo",
      name: "classinfo",
      component: () => import("@/views/classinfo/index.vue"),
      meta: {
        title: "课程信息",
        showLink: VITE_HIDE_HOME === "true" ? false : true
      }
    }
  ]
};
