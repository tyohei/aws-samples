# BYOC (Bring-Your-Own-Container) at Amazon SageMaker - Inference

## Deploy Resources

The CDK construct will deploy:
* An ECR repository to upload custom container images
* A SageMaker notebook instance to run Jupyter notebooks

```sh
cdk synth
cdk deploy
```

## Access Notebook Instance and Upload Files

* Access: https://console.aws.amazon.com/sagemaker/home#/notebook-instances
* Click "Open JupyterLab" at the SageMaker notebook instance deployed by CDK
* Create two folders under the working directory in the SageMaker notebook instance:
    * `pattern1`
    * `pattern2`
* Upload `./notebooks/pattern1.ipynb` under `pattern1` folder
* Upload `./notebooks/pattern2.ipynb` under `pattern2` folder

## Run Notebooks

* Open `pattern1.ipynb`
    * Choose `conda_pytorch_p310` or higher Python version for the kernel.
    * Run the cells from above.
* Open `pattern2.ipynb`
    * Choose `conda_pytorch_p310` or higher Python version for the kernel.
    * Run the cells from above.

## Delete Resources

```sh
cdk destroy
```
