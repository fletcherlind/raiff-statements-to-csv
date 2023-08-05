import './style.css'
import { setupConverter } from './converter.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <main>
        <h1>RAIFF Statements Converter</h1>
        <section>
            <h2>Step 0 (optional): Edit Categories Match Map</h2>
            <div id="categories-actions">
                <label class="btn js-upload-btn">
                    <input
                        type="file" 
                        accept=".json"
                        hidden 
                    />
                    <span class="js-label">Upload</span>
                </label>&nbsp;
                <button class="btn js-edit-btn">Edit</button>
            </div>
            <aside id="categories-editor" class="categories-editor hidden">
                <div class="editor-wrapper js-editor-wrapper">
                    <ul class="editor-lines js-editor-lines"></ul>
                    <pre class="editor-textarea js-editor" contenteditable="true"></pre>
                </div>
                <button class="btn js-cancel-btn" class="btn">Cancel</button>
                <button class="btn js-save-btn" class="btn">Save</button>
                |
                <button class="btn js-reset-btn" class="btn">Reset to Defaults</button>
                <button class="btn js-export-btn" class="btn">Export</button>
            </aside>
        </section>
        <section>
            <h2>Step 1: Convert PDF statement to XLS</h2>
            <a 
                target="_blank"
                class="btn"
                href="https://www.adobe.com/acrobat/online/pdf-to-excel.html">
                Go to Adobe PDF-XLS Converter
            </a>
        </section>
        <section>
            <h2>Step 2: Convert XLS file to CSV</h2>
            <label class="btn" id="upload-xls" for="upload-xls-input">
                <input
                    id="upload-xls-input" 
                    type="file" 
                    accept=".xls,.xlsx"
                    hidden 
                />
                <span class="js-label">Choose XLS File</span>
            </label>
        </section>
    </main>
`

setupConverter(document.querySelector<HTMLLabelElement>('#upload-xls')!)
