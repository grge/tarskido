import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router';
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
        props: (route: RouteLocationNormalized) => ({ bookId: route.params.bookId }),
      },
      {
        path: 'list',
        name: 'NodeList',
        component: NodeList,
        props: (route: RouteLocationNormalized) => ({ bookId: route.params.bookId }),
      },
      {
        path: 'edit',
        name: 'BookEdit',
        component: BookEdit,
        props: (route: RouteLocationNormalized) => ({ bookId: route.params.bookId }),
      },
      {
        path: ':nodeParam',
        component: NodeLayout,
        meta: { requiresBook: true },
        props: (route: RouteLocationNormalized) => ({
          bookId: route.params.bookId,
          nodeId: route.params.nodeId,
        }),
        children: [
          {
            path: '',
            name: 'Node',
            component: Node,
            props: (route: RouteLocationNormalized) => ({
              bookId: route.params.bookId,
              nodeId: route.params.nodeId,
            }),
          },
          {
            path: 'edit',
            name: 'NodeEdit',
            component: NodeEdit,
            props: (route: RouteLocationNormalized) => ({
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
    props: (route: RouteLocationNormalized) => ({ path: route.path }),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Handle GitHub Pages SPA fallback redirect
if (window.location.search.startsWith('?/')) {
  const redirectPath = window.location.search.slice(2) + window.location.hash;
  window.history.replaceState(null, '', redirectPath);
}

// Debug logging for visual display
function addDebugLog(message: string, data?: any) {
  console.log(message, data);
  const logs = JSON.parse(localStorage.getItem('tarskido-debug-logs') || '[]');
  logs.push({
    timestamp: new Date().toISOString(),
    message,
    data: data ? JSON.stringify(data) : undefined
  });
  // Keep only last 20 logs
  if (logs.length > 20) logs.shift();
  localStorage.setItem('tarskido-debug-logs', JSON.stringify(logs));
}

// Clear debug logs on fresh navigation
function clearDebugLogs() {
  localStorage.removeItem('tarskido-debug-logs');
}

router.beforeEach(async (to, from, next) => {
  addDebugLog('🔄 Router guard triggered', {
    toPath: to.path,
    toParams: to.params,
    requiresBook: to.matched.some(r => r.meta.requiresBook)
  });

  if (to.matched.some(r => r.meta.requiresBook)) {
    const shelf = useBookShelfStore();
    const bookStore = useBookStore();
    const rawParam = to.params.bookParam as string;
    
    addDebugLog('📚 Book route processing', { rawParam });

    // Ensure bookShelfStore is fully initialized (handles race conditions internally)
    addDebugLog('⏳ Initializing shelf...');
    await shelf.initialise();
    addDebugLog('✅ Shelf initialized');

    const bookId = shelf.resolveBookParam(rawParam);
    addDebugLog('🔍 Resolved book ID', { rawParam, bookId });

    if (!bookId) {
      addDebugLog('❌ No book ID found, redirecting to NotFound');
      return next({ name: 'NotFound' });
    }

    // Load book data if not already active
    if (shelf.activeBook !== bookId) {
      addDebugLog('📖 Loading book data for: ' + bookId);
      const bookData = await shelf.getBookData(bookId);
      addDebugLog('📄 Book data result', { bookId, hasData: !!bookData });
      
      if (bookData) {
        addDebugLog('✅ Loading book into store');
        bookStore.loadFromJSON(bookData, bookId);
        shelf.setActiveBook(bookId);
        addDebugLog('✅ Book loaded successfully');
      } else {
        addDebugLog('❌ No book data found, redirecting to NotFound');
        return next({ name: 'NotFound' });
      }
    } else {
      addDebugLog('✅ Book already active: ' + bookId);
    }
    
    to.params.bookId = bookId;

    if (to.params.nodeParam) {
      const np = to.params.nodeParam as string;
      let nodeId = bookStore.resolveNodeParam(np);
      if (!nodeId && bookStore.rawBook.nodes[np]) nodeId = np;
      addDebugLog('🔍 Node resolution', { nodeParam: np, nodeId });
      if (!nodeId) {
        addDebugLog('❌ No node ID found, redirecting to NotFound');
        return next({ name: 'NotFound' });
      }
      to.params.nodeId = nodeId;
    }
    
    addDebugLog('✅ Route guard success, proceeding to route');
  }
  next();
});

export default router;
