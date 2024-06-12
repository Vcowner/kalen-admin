/*
 * @Author: liaokt
 * @Description: 文件上传 hash 加密脚本
 * @Date: 2024-06-11 15:26:54
 * @LastEditors: liaokt
 * @LastEditTime: 2024-06-11 16:12:13
 */
import SparkMD5 from "spark-md5";

self.onmessage = async function (e) {
  const { file } = e.data;
  const fileHash = await calculateHash(file);
  self.postMessage({ fileHash });
};

// hash 加密
const calculateHash = async (file: any) => {
  return new Promise((resolve, reject) => {
    const spark = new SparkMD5.ArrayBuffer();

    const fileReader = new FileReader();

    const offset = 2 * 1024 * 1024;

    fileReader.onload = (e) => {
      // spark.append(e?.target?.result as ArrayBuffer);
      let fileMd5 = SparkMD5.ArrayBuffer.hash(e?.target?.result as ArrayBuffer);
      console.log(e.target, fileMd5);
      resolve(fileMd5);
    };

    fileReader.onerror = (e) => {
      reject(new Error("Error reading file"));
    };

    if (file.length === 1) {
      console.log("yes", file);
      fileReader.readAsArrayBuffer(new Blob(file));
    } else {
      const chunks = [file.slice(0, offset)];

      let cur = offset;

      while (cur < file.size) {
        if (cur + offset >= file.size) {
          chunks.push(file.slice(cur, cur + offset));
        } else {
          let mid = cur + offset / 2;
          let end = cur + offset;

          chunks.push(file.slice(cur, cur + 2));
          chunks.push(file.slice(mid, mid + 2));
          chunks.push(file.slice(end - 2, end));
        }
        cur += offset;
      }
      fileReader.readAsArrayBuffer(new Blob(chunks));
    }
  });
};
