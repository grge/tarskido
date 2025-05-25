import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Book from '@/views/Book.vue'
import BookEdit from '@/views/BookEdit.vue'
import Node from '@/views/Node.vue'
import NodeEdit from '@/views/NodeEdit.vue'
import { useBookStore } from '@/stores/bookshelf'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/book/:bookid',
      name: 'Book',
      component: Book
    },
    {
      path: '/book/:bookid/edit',
      name: 'BookEdit',
      component: BookEdit,
    },
    {
      path: '/book/:bookid/:nodeid',
      name: 'Node',
      component: Node
    },
    {
      path: '/book/:bookid/:nodeid/edit',
      name: 'NodeEdit',
      component: NodeEdit
    }
  ]
})

router.beforeEach(async (to, from) => {
  const bookId = (to.params.bookid as string|undefined)
  if (bookId) {
    const store = useBookStore()
    if (store.rawBook.id !== bookId) {
      await store.loadFromLocalStorage(bookId)
    }
  }
});

export default router
