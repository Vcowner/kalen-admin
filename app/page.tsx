/*
 * @Author: liaokt
 * @Description:
 * @Date: 2024-04-15 17:03:45
 * @LastEditors: liaokt
 * @LastEditTime: 2024-06-11 17:22:53
 */

"use client";

import { Button, Input, Progress, message } from "antd";
import SparkMD5 from "spark-md5";
import axios from "axios";
import { useState } from "react";

export default function Home() {
  const [process, setProcess] = useState(0);

  // 切片操作
  const createFileChunk = (file: any, size = 1 * 1024 * 1024) => {
    const chunks = [];
    let cur = 0;

    while (cur < file?.size) {
      chunks.push({ index: cur, file: file.slice(cur, cur + size) });
      cur += size;
    }

    return chunks;
  };

  const retry = (fn: Function, times: number) => {
    return fn().catch(async (err) => {
      if (times > 0) {
        return await retry(fn, times - 1);
      } else {
        throw err;
      }
    });
  };

  // 发送请求
  const sendRequest = async (chunks: any, processCb?: Function, maxLimit = 6, retryLimit = 3) => {
    return new Promise(async (resolve, reject) => {
      let start = 0;
      let process = 0;

      const requestList = chunks.map(
        ({ formData, index }: { formData: any; index: number }) =>
          () =>
            retry(() => {
              return axios.post("http://localhost:3001/files/upload", formData, {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
                onUploadProgress: (progressEvent) => {
                  // 如果需要显示进度条，可以在这里获取进度条的值
                  // 如果当前块上传完了，则从 chunks 过滤掉，并重新计算进度条
                  if (progressEvent.loaded === progressEvent.total) {
                    process++;
                    processCb && processCb(Math.floor((process / chunks.length) * 100));
                  }
                },
              });
            }, retryLimit)
      );

      const request = async () => {
        if (start > requestList.length - 1) {
          resolve("ok");
          return;
        }

        const currentBatch = requestList.slice(start, start + maxLimit);

        Promise.all(currentBatch.map((fn: Function) => fn()))
          .then((res) => {
            start += maxLimit;
            request();
          })
          .catch((err) => {
            reject(err);
          });
      };

      await request();
    });
  };

  // 合并操作
  const merge = async (fileHash: string, extname: string) => {
    await axios.post("http://localhost:3001/files/merge", {
      fileHash,
      extname,
    });
  };

  // 上传小文件
  const uploadSmallFile = async (file: any, retryLimit = 3, processCb?: Function) => {
    return new Promise((resolve, reject) => {
      const { formData } = file;

      retry(() => {
        return axios.post("http://localhost:3001/files/smallFileUpload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            processCb && processCb(Math.floor(progressEvent.loaded * 100));
          },
        });
      }, retryLimit)
        .then((response: any) => {
          resolve(response.data);
          return message.success("上传成功");
        })
        .catch((error: any) => {
          reject(error);
        });
    });
  };

  // 上传切块
  const uploadChunk = async (
    uploadChunkList: any[],
    fileHash: string,
    isSmall: Boolean,
    extname: string,
    processCb?: Function
  ) => {
    const list = uploadChunkList?.map(({ file, fileName, index, chunkName, fileHash }: any) => {
      const formData = new FormData();
      formData.set("fileHash", fileHash);
      formData.set("index", index);
      formData.set("extname", extname);
      formData.append("file", file);
      formData.append("fileName", fileName);
      formData.append("chunkName", chunkName);
      return { formData, index };
    });

    try {
      if (isSmall) {
        await uploadSmallFile(list[0]);
      } else {
        // 等待所有切块上传请求完成
        await sendRequest(list, processCb);

        // 调用合并接口
        await merge(fileHash, extname);
        message.success("上传成功");
      }
    } catch (error) {
      console.error("Error uploading chunks:", error);
    }
  };

  const updateProgress = (totalPercentage: any) => {
    setProcess(totalPercentage);
    console.log(`Total upload progress: ${totalPercentage}%`);
    // 这里更新你的总进度条
  };

  const upload = async (e) => {
    const files = e.target.files;
    setProcess(0);
    if (files) {
      const isSmall = files.length === 1 && files[0].size <= 2 * 1024 * 1024;

      const chunks = !isSmall ? createFileChunk(files[0]) : [{ file: files[0] }];

      const worker = new Worker(new URL("../workers/hashWorker.ts", import.meta.url), { type: "module" });

      worker.postMessage({ file: files[0] });
      worker.onmessage = async (event) => {
        const { fileHash } = event.data;

        const extname = "." + files[0]?.name?.split(".").pop();

        //   //   注意这里需要遍历 files 并逐个添加到 FormData
        //   for (let i = 0; i < files.length; i++) {
        //     data.append("files", files[i]);
        //   }

        const { data } = await axios.post("http://localhost:3001/files/verify", {
          fileHash: fileHash,
          totalCount: chunks.length,
          extname,
        });

        const {
          data: { needFileList },
        } = data;

        if (!needFileList?.length) {
          updateProgress(100);
          return message.success("上传成功");
        }

        const uploadChunkList = chunks
          .map(({ file }, index) => ({
            file,
            fileHash,
            size: file.size,
            percent: 0,
            chunk: file,
            chunkName: `${files[0].name}-${index}`,
            fileName: files[0].name,
            extname,
            index: index + 1,
          }))
          .filter(({ index }) => needFileList.includes(index));

        await uploadChunk(uploadChunkList, fileHash, isSmall, extname, updateProgress);
      };
    }
  };

  return (
    <div>
      <Input type="file" onChange={upload} />
      <Progress percent={process} size="small" />
      {/* <Button onClick={upload}>上传</Button> */}
    </div>
  );
}
