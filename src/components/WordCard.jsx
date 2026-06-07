import { createSignal } from 'solid-js';

export default function WordCard(props) {
  return (
    <div class="word-card card">
      <div class="word-card-word">{props.word.word}</div>
      {props.showPhonetic && (
        <div class="word-card-phonetic">{props.word.phonetic}</div>
      )}
      {props.showMeaning && (
        <div class="word-card-meaning">{props.word.meaning}</div>
      )}
      {props.showExample && (
        <div class="word-card-example">
          <span class="example-label">例句：</span>
          {props.word.example}
        </div>
      )}
      {props.difficulty && (
        <div class="word-difficulty">
          {'★'.repeat(props.difficulty)}{'☆'.repeat(5 - props.difficulty)}
        </div>
      )}
    </div>
  );
}
