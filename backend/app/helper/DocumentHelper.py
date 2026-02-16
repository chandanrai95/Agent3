from bson import ObjectId
from langchain_community.document_loaders import (
    TextLoader,
    PyPDFLoader,
    Docx2txtLoader
)
from langchain_text_splitters import RecursiveCharacterTextSplitter

import app.config.database as database
from app.helper.source import createSource


class DocumentHelper:
    def __init__(self, collection_name: str = "embeddings", index_name: str = "vector_index"):

        self.db = database.getVectorStoreDb(collection_name, index_name)

    def load_file(self, file_path: str):
        if file_path.endswith("pdf"):
            return PyPDFLoader(file_path).load()
        elif file_path.endswith("docx"):
            return Docx2txtLoader(file_path).load()
        elif file_path.endswith('txt'):
            return TextLoader(file_path).load()
        raise Exception("Unsupported file type.")

    def split_text(self, doc):
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=150
        )

        return splitter.split_documents(doc)

    async def add_document(self, file_path: str, agent_id: str):
        print("stage 0", file_path, agent_id)
        doc = self.load_file(file_path)
        chunks = self.split_text(doc)
        print("stage 1")
        source = await createSource(database.db, agent_id, file_path, "document")
        print("stage 2", source)
        if not chunks or len(chunks) == 0:
            raise Exception(f"Document {file_path} doesn't have chunks")
        print("stage 3")
        for chunk in chunks:
            chunk.metadata = {
                **chunk.metadata,
                "source_id": source.inserted_id,
                "source_path": file_path,
                "agent_id": ObjectId(agent_id)
            }
        print("stage 4")
        self.db.add_documents(chunks)
        print("stage 5", len(chunks))
        return len(chunks)
