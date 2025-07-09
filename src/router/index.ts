import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Book from '@/views/Book.vue';
import BookEdit from '@/views/BookEdit.vue';
import Node from '@/views/Node.vue';
import NodeEdit from '@/views/NodeEdit.vue';
import NodeList from '@/views/NodeList.vue';
import BookLayout from '@/layouts/BookLayout.vue';
import NodeLayout from '@/layouts/NodeLayout.vue';
import NotFound from '@/views/NotFound.vue';
import { useBookShelfStore } from '@/stores/bookShelfStore';
import { useBookStore } from '@/stores/bookStore';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/book/:bookParam',
    meta: { requiresBook: true },
    component: BookLayout,
    children: [
      {
        path: '',
        name: 'Book',
        component: Book,
        props: route => ({ bookId: route.params.bookId }),
      },
      {
        path: 'list',
        name: 'NodeList',
        component: NodeList,
        props: route => ({ bookId: route.params.bookId }),
      },
      {
        path: 'edit',
        name: 'BookEdit',
        component: BookEdit,
        props: route => ({ bookId: route.params.bookId }),
      },
      {
        path: ':nodeParam',
        component: NodeLayout,
        meta: { requiresBook: true },
        props: route => ({
          bookId: route.params.bookId,
          nodeId: route.params.nodeId,
        }),
        children: [
          {
            path: '',
            name: 'Node',
            component: Node,
            props: route => ({
              bookId: route.params.bookId,
              nodeId: route.params.nodeId,
            }),
          },
          {
            path: 'edit',
            name: 'NodeEdit',
            component: NodeEdit,
            props: route => ({
              bookId: route.params.bookId,
              nodeId: route.params.nodeId,
            }),
          },
        ],
      },
    ],
  },
  {
    path: '/:catchAll(.*)',
    name: 'NotFound',
    component: NotFound,
    props: route => ({ path: route.path }),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  if (to.matched.some(r => r.meta.requiresBook)) {
    const shelf = useBookShelfStore();
    const rawParam = to.params.bookParam as string;

    const bookId = shelf.resolveBookParam(rawParam);

    if (!bookId) {
      return next({ name: 'NotFound' });
    }
    shelf.activeBook !== bookId && (await shelf.loadBook(bookId));
    to.params.bookId = bookId;

    if (to.params.nodeParam) {
      const bookStore = useBookStore();
      const np = to.params.nodeParam as string;
      let nodeId = bookStore.resolveNodeParam(np);
      if (!nodeId && bookStore.rawBook.nodes[np]) nodeId = np;
      if (!nodeId) {
        return next({ name: 'NotFound' });
      }
      to.params.nodeId = nodeId;
    }
  }
  next();
});

export default router;
