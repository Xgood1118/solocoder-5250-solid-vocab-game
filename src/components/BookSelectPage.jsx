import { createSignal, onMount, Show } from 'solid-js';
import { useGameStore } from '../store/gameStore';
import { getBooks, importWordData } from '../utils/db';

export default function BookSelectPage() {
  const { store, navigate, selectBook, refreshBooks, showToast } = useGameStore();
  const [showImport, setShowImport] = createSignal(false);
  const [importText, setImportText] = createSignal('');

  onMount(async () => {
    await refreshBooks();
  });

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = await importWordData(data);
      
      if (result.imported) {
        showToast(`导入成功，共 ${result.count} 个单词`, 'success');
        await refreshBooks();
      } else {
        showToast(result.message || '导入失败', 'error');
      }
    } catch (err) {
      showToast('文件格式错误', 'error');
    }
    
    e.target.value = '';
  };

  const handleTextImport = async () => {
    try {
      const data = JSON.parse(importText());
      const result = await importWordData(data);
      
      if (result.imported) {
        showToast(`导入成功，共 ${result.count} 个单词`, 'success');
        await refreshBooks();
        setShowImport(false);
        setImportText('');
      } else {
        showToast(result.message || '导入失败', 'error');
      }
    } catch (err) {
      showToast('JSON 格式错误', 'error');
    }
  };

  return (
    <div class="page book-select-page">
      <div class="page-header">
        <button class="back-btn" onClick={() => navigate('menu')}>←</button>
        <h2>选择教材</h2>
        <button class="add-btn" onClick={() => setShowImport(true)}>+</button>
      </div>
      
      <div class="page-content">
        <Show when={store.books.length === 0}>
          <div class="empty-state">
            <div class="empty-icon">📚</div>
            <p>还没有教材，点击右上角 + 导入单词 JSON 文件</p>
          </div>
        </Show>
        
        <div class="book-list">
          {store.books.map(book => (
            <button 
              key={book.id} 
              class="book-card card"
              onClick={() => selectBook(book.id)}
            >
              <div class="book-icon">📖</div>
              <div class="book-info">
                <div class="book-name">{book.name}</div>
                <div class="book-meta">12 关 · 120 个单词</div>
              </div>
              <div class="book-arrow">→</div>
            </button>
          ))}
        </div>
      </div>
      
      <Show when={showImport()}>
        <div class="modal-overlay" onClick={() => setShowImport(false)}>
          <div class="modal card" onClick={e => e.stopPropagation()}>
            <h3>导入单词数据</h3>
            <p>选择 JSON 文件或粘贴 JSON 内容</p>
            
            <div class="import-section">
              <label class="file-label">
                <input type="file" accept=".json" onChange={handleFileImport} hidden />
                <span>选择文件</span>
              </label>
            </div>
            
            <div class="divider">或</div>
            
            <textarea
              class="import-textarea"
              value={importText()}
              onInput={e => setImportText(e.target.value)}
              placeholder='{"bookId":"book1","bookName":"初一上","levels":[{"level":1,"words":[...]}]}'
              rows="6"
            />
            
            <div class="modal-actions">
              <button class="secondary-btn" onClick={() => setShowImport(false)}>
                取消
              </button>
              <button 
                class="primary-btn" 
                onClick={handleTextImport}
                disabled={!importText().trim()}
              >
                导入
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
